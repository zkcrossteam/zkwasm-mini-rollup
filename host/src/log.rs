use std::os::raw::c_uchar;

#[link(wasm_import_module = "zkc_node_host")]
extern "C" {
    pub fn host_log_str(str_ptr: *const c_uchar, str_len: usize);
    pub fn host_log_char(c: u64);
}

#[no_mangle]
pub fn wasm_dbg(v: u64) {
    wasm_dbg_char(v);
}

#[no_mangle]
pub fn wasm_dbg_char(v: u64) {
    unsafe {
        host_log_char(v);
    }
}
