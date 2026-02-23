// Helper circuit: computes Poseidon2(secret, salt) and returns the result.
// No assertion - used to discover the commitment value before proof generation.
fn main(name_secret: Field, salt: Field) -> pub Field {
    std::hash::poseidon2_permutation([name_secret, salt, 0, 0], 4)[0]
}
