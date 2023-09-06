#![no_std]
pub const CODE: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/lego.jsc"));
