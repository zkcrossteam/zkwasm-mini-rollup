import axios from 'axios';
import {get_image_md5,} from "./config.js";
import {TxWitness} from "./prover.js";

const zkc_node_endpoint = "http://127.0.0.1:12345";

export class ZKCNodeHelper {
    private baseUrl: string;
    private instance;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.instance = axios.create({
            baseURL: this.baseUrl,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    public async queryState(key: BigUint64Array): Promise<string> {
        try {
            const strKey: Array<string> = new Array<string>(key.length);
            key.forEach((v, i) => strKey[i] = v.toString());

            const params = {
                "key": strKey
            }
            const response = await this.instance.post(
                "/",
                {
                    "jsonrpc": "2.0",
                    "method": "query-state",
                    "params": params
                }
            )
            if (response.status === 200) {
                if (response.data?.error === undefined) {
                    return response.data?.result
                } else {
                    const jsonError = response.data?.error;
                    throw "queryStateServerError " + jsonError;
                }
            } else {
                throw "queryStateError";
            }
        } catch (error) {
            console.error('Error:', error);
            throw "queryStateError " + error;
        }
    }

    public async execute(id: string, params: Array<string>): Promise<JSON> {
        try {
            const p = {
                "id": id,
                "params": params,
            };
            const response = await this.instance.post(
                "/",
                {
                    "jsonrpc": "2.0",
                    "method": "execute",
                    "params": p,
                }
            );
            if (response.status === 200) {
                if (response.data?.error === undefined) {
                    return response.data?.result;
                } else {
                    const jsonError = response.data?.error;
                    throw "executeServerError " + jsonError;
                }
            } else {
                throw "executeError";
            }
        } catch (error) {
            console.error('Error:', error);
            throw "executeError " + error;
        }
    }
}

export async function execute(id: string, tx: TxWitness) {
    const params: Array<string> = [];
    params.push(`0x${tx.msg}:bytes-packed`);
    params.push(`0x${tx.pkx}:bytes-packed`);
    params.push(`0x${tx.pky}:bytes-packed`);
    params.push(`0x${tx.sigx}:bytes-packed`);
    params.push(`0x${tx.sigy}:bytes-packed`);
    params.push(`0x${tx.sigr}:bytes-packed`);

    const helper = new ZKCNodeHelper(zkc_node_endpoint);

    let response = await helper.execute(id, params);
    console.log("response is ", response);
    return response;
}

export async function queryState(key: BigUint64Array) {
    const helper = new ZKCNodeHelper(zkc_node_endpoint);

    try {
        let response = await helper.queryState(key);
        console.log("response is ", response);
        return response;
    } catch (error) {
        console.error('queryState Error:', error);
        throw "queryStateError " + error;
    }
}
