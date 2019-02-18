"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const r = require("ramda");
const crypto = require("crypto");
const MerkleTree = require('merkletreejs');
function sha256(data) {
    return crypto.createHash('sha256').update(data).digest();
}
/** {name: 'leon', job: {title: 'rd'}} => [{name: 'leon'}, {'job,title': 'rd'}] */
function elements(doc, seperator) {
    function elems(value, prefixs) {
        if (typeof (value) === 'object') {
            if (value instanceof Array) {
                return value.map(v => elems(v, prefixs))
                    .reduce((acc, list) => acc.concat(list), []);
            }
            else {
                return r.toPairs(value)
                    .map(([field, value]) => elems(value, prefixs.concat(field)))
                    .reduce((acc, list) => acc.concat(list), []);
            }
        }
        else {
            return [[...prefixs, value].join(seperator)];
        }
    }
    return r.toPairs(doc)
        .map(([field, value]) => elems(value, [field]))
        .reduce((acc, list) => acc.concat(list), []);
}
exports.elements = elements;
function _verify(data, root, proof) {
    const r = proof.reduce((acc, p) => {
        const pair = p.position === 'left' ? [p.data, acc] : [acc, p.data];
        return sha256(Buffer.concat(pair));
    }, sha256(data));
    return r.toString('hex') === root.toString('hex');
}
function root(doc) {
    const leaves = elements(doc, ',').map(v => sha256(Buffer.from(v)));
    const tree = new MerkleTree(leaves, sha256);
    return tree.getRoot();
}
exports.root = root;
function proof(doc, partialDoc) {
    const leaves = elements(doc, ',').map(v => sha256(Buffer.from(v)));
    const tree = new MerkleTree(leaves, sha256);
    return elements(partialDoc, ',')
        .map(v => sha256(Buffer.from(v)))
        .map(b => tree.getProof(b));
}
exports.proof = proof;
function verify(root, partialDoc, proof) {
    const datas = elements(partialDoc, ',').map(v => Buffer.from(v));
    return r.zip(datas, proof)
        .every(([data, proof]) => _verify(data, root, proof));
}
exports.verify = verify;
