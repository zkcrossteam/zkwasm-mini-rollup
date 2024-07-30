use context::{
    datacache::CacheContext, jubjub::sum::BabyJubjubSumContext, merkle::MerkleContext,
    poseidon::PoseidonContext,
};
use std::sync::Mutex;

pub mod alloc;
pub mod context;
pub mod jubjub;
pub mod poseidon;
pub mod log;

lazy_static::lazy_static! {
    pub static ref DATACACHE_CONTEXT: Mutex<CacheContext> = Mutex::new(CacheContext::new());
    pub static ref MERKLE_CONTEXT: Mutex<MerkleContext> = Mutex::new(MerkleContext::new(0));
    pub static ref POSEIDON_CONTEXT: Mutex<PoseidonContext> = Mutex::new(PoseidonContext::default(0));
    pub static ref JUBJUB_CONTEXT: Mutex<BabyJubjubSumContext> = Mutex::new(BabyJubjubSumContext::default(0));
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
pub fn wasm_input(is_public: u32) -> u64 {
    panic!()
}

#[no_mangle]
pub fn wasm_output(v: u64) {
    panic!()
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
