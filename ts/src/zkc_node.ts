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
    console.log("response is ", response);
    return response;
}
