use context::{
    context::Context, datacache::CacheContext, jubjub::sum::BabyJubjubSumContext,
    merkle::MerkleContext, poseidon::PoseidonContext,
};
use std::mem;
use std::os::raw::c_uchar;
use std::sync::{Mutex, OnceLock};

pub mod alloc;
pub mod context;
pub mod jubjub;
pub mod log;
pub mod poseidon;

pub static CONTEXT: OnceLock<Mutex<Context>> = OnceLock::new();
lazy_static::lazy_static! {
    pub static ref DATACACHE_CONTEXT: Mutex<CacheContext> = Mutex::new(CacheContext::new());
    pub static ref MERKLE_CONTEXT: Mutex<MerkleContext> = Mutex::new(MerkleContext::new(0));
    pub static ref POSEIDON_CONTEXT: Mutex<PoseidonContext> = Mutex::new(PoseidonContext::default(0));
    pub static ref JUBJUB_CONTEXT: Mutex<BabyJubjubSumContext> = Mutex::new(BabyJubjubSumContext::default(0));
}

#[link(wasm_import_module = "zkc_node_host")]
extern "C" {
    pub fn host_log_str(str_ptr: *const c_uchar, str_len: usize);
}

#[no_mangle]
pub fn cache_set_mode(mode: u64) {
    DATACACHE_CONTEXT.lock().unwrap().set_mode(mode);
}

#[no_mangle]
pub fn cache_set_hash(arg: u64) {
    DATACACHE_CONTEXT.lock().unwrap().set_data_hash(arg);
}

#[no_mangle]
pub fn cache_store_data(data: u64) {
    DATACACHE_CONTEXT.lock().unwrap().store_data(data);
}

#[no_mangle]
pub fn cache_fetch_data() -> u64 {
    DATACACHE_CONTEXT.lock().unwrap().fetch_data()
}

#[no_mangle]
pub fn poseidon_new(arg: u64) {
    POSEIDON_CONTEXT.lock().unwrap().poseidon_new(arg as usize);
}

#[no_mangle]
pub fn poseidon_push(arg: u64) {
    POSEIDON_CONTEXT.lock().unwrap().poseidon_push(arg);
}

#[no_mangle]
pub fn poseidon_finalize() -> u64 {
    POSEIDON_CONTEXT.lock().unwrap().poseidon_finalize()
}

#[no_mangle]
pub fn babyjubjub_sum_new(arg: u64) {
    JUBJUB_CONTEXT
        .lock()
        .unwrap()
        .babyjubjub_sum_new(arg as usize);
}

#[no_mangle]
pub fn babyjubjub_sum_push(arg: u64) {
    JUBJUB_CONTEXT.lock().unwrap().babyjubjub_sum_push(arg);
}

#[no_mangle]
pub fn babyjubjub_sum_finalize() -> u64 {
    JUBJUB_CONTEXT.lock().unwrap().babyjubjub_sum_finalize()
}

#[no_mangle]
pub fn merkle_setroot(arg: u64) {
    MERKLE_CONTEXT.lock().unwrap().merkle_setroot(arg);
}

#[no_mangle]
pub fn merkle_getroot() -> u64 {
    MERKLE_CONTEXT.lock().unwrap().merkle_getroot()
}

#[no_mangle]
pub fn merkle_address(arg: u64) {
    MERKLE_CONTEXT.lock().unwrap().merkle_address(arg);
}

#[no_mangle]
pub fn merkle_set(arg: u64) {
    MERKLE_CONTEXT.lock().unwrap().merkle_set(arg);
}

#[no_mangle]
pub fn merkle_get() -> u64 {
    MERKLE_CONTEXT.lock().unwrap().merkle_get()
}

// #[wasm_bindgen]
// pub fn check() -> BigUint64Array {
//     crate::context::datacache::get_record([10; 32].to_vec())
// }

#[no_mangle]
pub fn wasm_setup_inputs(public_ptr: u32, public_len: u32, private_ptr: u32, private_len: u32) {
    unsafe {
        let public_inputs = Vec::<u64>::from_raw_parts(
            public_ptr as *mut u64,
            public_len as usize,
            public_len as usize,
        );
        let private_inputs = Vec::<u64>::from_raw_parts(
            private_ptr as *mut u64,
            private_len as usize,
            private_len as usize,
        );

        CONTEXT.get_or_init(|| Mutex::new(Context::new(public_inputs, private_inputs)));
    }
}

#[no_mangle]
pub fn wasm_dump_output() -> u64 {
    let m = CONTEXT.get().unwrap();
    let mut c = m.lock().unwrap();

    let output = c.dump_output();

    let log_str = format!("wasm_dump_output: sending output {:?}", output);
    unsafe {
        host_log_str(log_str.as_ptr(), log_str.len());
    }

    let output_len = output.len();
    let output_ptr = output.as_ptr();
    mem::forget(output);

    ((output_ptr as u64) << 32) | (output_len as u64)
}

#[no_mangle]
pub fn wasm_input(is_public: u32) -> u64 {
    let m = CONTEXT.get().unwrap();
    let mut c = m.lock().unwrap();
    c.wasm_input(is_public as i32)
}

#[no_mangle]
pub fn wasm_output(v: u64) {
    let m = CONTEXT.get().unwrap();
    let mut c = m.lock().unwrap();
    c.wasm_output(v)
}

#[no_mangle]
pub fn assert(cond: i32) {
    require(cond)
}

#[no_mangle]
pub fn require(cond: i32) {
    if cond == 0 {
        panic!()
    }
}

#[no_mangle]
pub fn wasm_trace_size() -> u64 {
    0
}
