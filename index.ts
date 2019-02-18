import * as r from 'ramda';
import * as  crypto from 'crypto';
const MerkleTree = require('merkletreejs');

type Primitive = string | number | boolean;
type Json = Primitive | Primitive[] | {[field: string]: Json} | {[field: string]: Json}[];

type Doc = {[field: string]: Json};

function sha256 (data: Buffer): Buffer {
    return crypto.createHash('sha256').update(data).digest()
}

/** {name: 'leon', job: {title: 'rd'}} => [{name: 'leon'}, {'job,title': 'rd'}] */
export function elements (doc: Doc, seperator: string): string[] {
    function elems (value: Json, prefixs: string[]): string[] {
        if (typeof(value) === 'object') {
            if (value instanceof Array) {
                return (value as Json[]).map(v => elems(v, prefixs))
                .reduce((acc, list) => acc.concat(list), []);
            } else {
                return r.toPairs(value)
                .map(([field, value]) => elems(value, prefixs.concat(field)))
                .reduce((acc, list) => acc.concat(list), []);
            }
        } else {
            return [[...prefixs, value].join(seperator)];
        }
    }
    return r.toPairs(doc)
        .map(([field, value]) => elems(value, [field]))
        .reduce((acc, list) => acc.concat(list), []);
}

type Proof = {position: 'left' | 'right', data: Buffer}[];
type DocProof = Proof[];

function _verify (data: Buffer, root: Buffer, proof: Proof) {
    const r = proof.reduce(
        (acc, p) => {
            const pair = p.position === 'left' ? [p.data, acc] : [acc, p.data];
            return sha256(Buffer.concat(pair))
        },
        sha256(data));
    return r.toString('hex') === root.toString('hex');
}

export function root (doc: Doc): Buffer {
    const leaves = elements(doc, ',').map(v => sha256(Buffer.from(v)));
    const tree = new MerkleTree(leaves, sha256);
    return tree.getRoot();
}

export function proof (doc: Doc, partialDoc: Doc): DocProof {
    const leaves = elements(doc, ',').map(v => sha256(Buffer.from(v)));
    const tree = new MerkleTree(leaves, sha256);
    return elements(partialDoc, ',')
    .map(v => sha256(Buffer.from(v)))
    .map(b => tree.getProof(b));
}

export function verify (root: Buffer, partialDoc: Doc, proof: DocProof) {
    const datas = elements(partialDoc, ',').map(v => Buffer.from(v));
    return r.zip(datas, proof)
    .every(([data, proof]) => _verify(data, root, proof));
}
