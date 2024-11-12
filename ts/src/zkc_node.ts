import axios from 'axios';
import {
  get_image_md5,
} from "./config.js";
import { TxWitness } from "./prover.js";

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

    public async queryLatestKvpair(md5: string, key: BigUint64Array): Promise<BigUint64Array> {
        try {
            const strKey: Array<string> = new Array<string>(key.length);
            key.forEach((v, i) => strKey[i] = v.toString());

            const params = {
                "image_md5": md5,
                "key": strKey
            }
            const response = await this.instance.post(
                "/",
                {
                    "jsonrpc": "2.0",
                    "method": "rpc-query-latest-kvpair",
                    "params": params
                }
            )
            if (response.status === 200) {
                if (response.data?.error === undefined) {
                    const jsonResult = response.data?.result;
                    const strValue: string[] = jsonResult.value;
                    const u64array = new BigUint64Array(strValue.map((v) => BigInt(v)));
                    return u64array;
                } else {
                    const jsonError = response.data?.error;
                    throw "queryLatestKvpairServerError " + jsonError;
                }
            } else {
                throw "queryLatestKvpairError";
            }
        } catch (error) {
            console.error('Error:', error);
            throw "queryLatestKvpairError " + error;
        }
    }

    public async queryState(md5: string, key: BigUint64Array): Promise<string> {
        try {
            const strKey: Array<string> = new Array<string>(key.length);
            key.forEach((v, i) => strKey[i] = v.toString());

            const params = {
                "image_md5": md5,
                "key": strKey
            }
            const response = await this.instance.post(
                "/",
                {
                    "jsonrpc": "2.0",
                    "method": "rpc-query-state",
                    "params": params
                }
            )
            if (response.status === 200) {
                if (response.data?.error === undefined) {
                    const jsonResult = response.data?.result;
                    return jsonResult.state;
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

    public async submitTx(md5: string, publicInputs: Array<string>,
                          privateInputs: Array<string>, txdata: Uint8Array): Promise<JSON> {
        try {
            const params = {
                "image_md5": md5,
                "weight": 100, // TODO: update
                "public_inputs": publicInputs,
                "private_inputs": privateInputs
            };
            const response = await this.instance.post(
                "/",
                {
                    "jsonrpc": "2.0",
                    "method": "submit-tx",
                    "params": params
                }
            );
            if (response.status === 200) {
                if (response.data?.error === undefined) {
                    const jsonResult = response.data?.result;
                    return jsonResult;
                } else {
                    const jsonError = response.data?.error;
                    throw "submitTxServerError " + jsonError;
                }
            } else {
                throw "submitTxError";
            }
        } catch (error) {
            console.error('Error:', error);
            throw "submitTxError " + error;
        }
    }

    public async executeBatchDirect(md5: string, publicInputs: Array<string>,
                          privateInputs: Array<string>, txdata: Uint8Array): Promise<JSON> {
        try {
            const params = {
                "hash": "internal-test-batch",
                "txs": [
                    {
                        "hash": "internal-test-tx",
                        "image_md5": md5,
                        "weight": 100, // TODO: update
                        "public_inputs": publicInputs,
                        "private_inputs": privateInputs
                        // todo: input context
                    }
                ]
            };
            const response = await this.instance.post(
                "/",
                {
                    "jsonrpc": "2.0",
                    "method": "execute-batch-direct",
                    "params": params
                }
            );
            if (response.status === 200) {
                if (response.data?.error === undefined) {
                    return response.data?.result;
                }
                else {
                    const jsonError = response.data?.error;
                    throw "executeBatchDirectServerError " + jsonError;
                }
            } else {
                throw "executeBatchDirectError";
            }
        } catch (error) {
            console.error('Error:', error);
            throw "executeBatchDirectError " + error;
        }
    }
}

export async function submitTx(txs: Array<TxWitness>, txdata: Uint8Array) {
    const priv_inputs: Array<string> = [];
    priv_inputs.push(`${txs.length}:i64`);
    for (const tx of txs) {
        priv_inputs.push(`0x${tx.msg}:bytes-packed`);
        priv_inputs.push(`0x${tx.pkx}:bytes-packed`);
        priv_inputs.push(`0x${tx.pky}:bytes-packed`);
        priv_inputs.push(`0x${tx.sigx}:bytes-packed`);
        priv_inputs.push(`0x${tx.sigy}:bytes-packed`);
        priv_inputs.push(`0x${tx.sigr}:bytes-packed`);
    };

    // TODO: txdata

    const helper = new ZKCNodeHelper(zkc_node_endpoint);

    let response = await helper.submitTx(get_image_md5(), [], priv_inputs, new Uint8Array());
    //let response = await helper.executeBatchDirect(get_image_md5(), [], priv_inputs, new Uint8Array());
    console.log("response is ", response);
    return response;
}

export async function queryLatestKvpair(key: BigUint64Array) {
    const helper = new ZKCNodeHelper(zkc_node_endpoint);

    let response = await helper.queryLatestKvpair(get_image_md5(), key);
    console.log("response is ", response);
    return response;
}

export async function queryState(key: BigUint64Array) {
    const helper = new ZKCNodeHelper(zkc_node_endpoint);

    let response = await helper.queryState(get_image_md5(), key);
    console.log("response is ", response);
    return response;
}
