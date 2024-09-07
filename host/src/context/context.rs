pub struct Context {
    pub public_inputs: Vec<u64>,
    pub private_inputs: Vec<u64>,
    // pub instance: Vec<u64>, TODO: check usage
    pub output: Vec<u64>,
}

impl Context {
    pub fn new(public_inputs: Vec<u64>, private_inputs: Vec<u64>) -> Self {
        Context {
            public_inputs,
            private_inputs,
            // instance: vec![],
            output: vec![],
        }
    }

    pub fn pop_public(&mut self) -> u64 {
        if self.public_inputs.is_empty() {
            panic!("failed to read public input, please checkout your input");
        }
        self.public_inputs.remove(0)
    }

    pub fn pop_private(&mut self) -> u64 {
        if self.private_inputs.is_empty() {
            panic!("failed to read private input, please checkout your input");
        }
        self.private_inputs.remove(0)
    }

    // fn push_public(&mut self, value: u64) {
    //     self.instance.push(value)
    // }

    fn push_output(&mut self, value: u64) {
        // self.instance.push(value);
        self.output.push(value);
    }

    pub fn wasm_input(&mut self, arg: i32) -> u64 {
        assert!(arg == 0 || arg == 1);

        if arg == 1 {
            let value = self.pop_public();
            // self.push_public(value);
            value
        } else {
            self.pop_private()
        }
    }

    pub fn wasm_output(&mut self, value: u64) {
        self.push_output(value);
    }

    pub fn dump_output(&mut self) -> Vec<u64> {
        self.output.clone()
    }
}
