use bytes_helper::Reduce;
use bytes_helper::ReduceRule;
use std::os::raw::{c_uchar, c_ulonglong};

const FETCH_MODE: u64 = 0;
const STORE_MODE: u64 = 1;

#[link(wasm_import_module = "zkc_node_host")]
extern "C" {
    pub fn host_update_record(
        hash_ptr: *const c_uchar,
        hash_len: usize,
        data_ptr: *const c_ulonglong,
        data_len: usize,
    );
    pub fn host_get_record_pre(hash_ptr: *const c_uchar, hash_len: usize) -> usize;
    pub fn host_get_record(
        hash_ptr: *const c_uchar,
        hash_len: usize,
        output_ptr: *mut c_ulonglong,
        output_len: usize,
    );
}

fn update_record(hash: Vec<u8>, data: Vec<u64>) {
    let hash_ptr = hash.as_ptr();
    let data_ptr = data.as_ptr();

    unsafe { host_update_record(hash_ptr, hash.len(), data_ptr, data.len()) }
}

fn get_record(hash: Vec<u8>) -> Vec<u64> {
    let hash_ptr = hash.as_ptr();

    let output_size: usize;

    unsafe {
        output_size = host_get_record_pre(hash_ptr, hash.len());
    }

    let mut output: Vec<u64> = Vec::with_capacity(output_size);
    let output_ptr = output.as_mut_ptr() as *mut c_ulonglong;

    unsafe {
        host_get_record(hash_ptr, hash.len(), output_ptr, output_size);

        output.set_len(output_size);
        output
    }
}

pub struct CacheContext {
    pub mode: u64,
    pub hash: Reduce,
    pub data: Vec<u64>,
    pub fetch: bool,
}

fn new_reduce(rules: Vec<ReduceRule>) -> Reduce {
    Reduce { cursor: 0, rules }
}

impl CacheContext {
    pub fn new() -> Self {
        CacheContext {
            mode: 0,
            hash: new_reduce(vec![ReduceRule::Bytes(vec![], 4)]),
            fetch: false,
            data: vec![],
        }
    }

    pub fn set_mode(&mut self, v: u64) {
        self.mode = v;
        self.data = vec![];
    }

    pub fn set_data_hash(&mut self, v: u64) {
        self.hash.reduce(v);
        if self.hash.cursor == 0 {
            let hash: [u8; 32] = self.hash.rules[0]
                .bytes_value()
                .unwrap()
                .try_into()
                .unwrap();
            if self.mode == FETCH_MODE {
                //let data = get_record(array_from_u8_to_js(&hash.clone()));
                self.data = get_record(hash.to_vec());
                self.fetch = false;
            } else if self.mode == STORE_MODE {
                // put data and hash into mongo_datahash
                if !self.data.is_empty() {
                    update_record(hash.to_vec(), self.data.clone())
                }
            }
        }
    }

    pub fn fetch_data(&mut self) -> u64 {
        if self.fetch == false {
            self.fetch = true;
            self.data.reverse();
            self.data.len() as u64
        } else {
            self.data.pop().unwrap()
        }
    }

    pub fn store_data(&mut self, v: u64) {
        self.data.push(v);
    }
}

impl CacheContext {}
