import { expect } from 'chai';
import * as pdp from '../';

declare const describe, it, before, after, afterEach;

const order = {
    id: 'o-001',
    amount: 500,
    customer: {
        id: 'c-001',
    },
    items: [
        {pid: 'p-001', count: 5, price: 25},
        {pid: 'p-002', count: 10, price: 2},
    ],
}

describe('doc verify', () => {
    it('basic', done => {
        const partial = {
            amount: 500,
            customer: {
                id: 'c-001',
            },
        };
        const root = pdp.root(order);
        const proof = pdp.proof(order, partial);
        expect(pdp.verify(root, partial, proof)).eql(true);
        done();
    });

    it('basic fail', done => {
        const partial = {
            amount: 500,
            customer: {
                id: 'c-002',
            },
        }
        const root = pdp.root(order);
        const proof = pdp.proof(order, partial);
        expect(pdp.verify(root, partial, proof)).eql(false);
        done();
    });

    it('array', done => {
        const partial = {
            amount: 500,
            items: [
                {pid: 'p-001', count: 5},
            ],
        }
        const root = pdp.root(order);
        const proof = pdp.proof(order, partial);
        expect(pdp.verify(root, partial, proof)).eql(true);
        done();
    });

    it('array fail', done => {
        const partial = {
            amount: 500,
            items: [
                {pid: 'p-001', count: 6},
            ],
        }
        const root = pdp.root(order);
        const proof = pdp.proof(order, partial);
        expect(pdp.verify(root, partial, proof)).eql(false);
        done();
    });
});
