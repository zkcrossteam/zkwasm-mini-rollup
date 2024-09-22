import axios from 'axios';

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

    public async submitTx(md5: string, publicInputs: string[],
                          privateInputs: string[]): Promise<JSON> {

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
