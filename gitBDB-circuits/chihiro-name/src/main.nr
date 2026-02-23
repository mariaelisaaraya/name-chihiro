fn main(
    name_secret: Field,
    salt: Field,
    name_commit: pub Field,
) {
    let computed = std::hash::poseidon2_permutation([name_secret, salt, 0, 0], 4)[0];
    assert(computed == name_commit, "Secret does not match stored commitment");
}

#[test]
fn test_valid_proof_passes() {
    let name_secret: Field = 0x63686968697261;
    let salt: Field = 0x1234abcd;
    let name_commit = std::hash::poseidon2_permutation([name_secret, salt, 0, 0], 4)[0];
    main(name_secret, salt, name_commit);
}

#[test(should_fail)]
fn test_wrong_secret_rejected() {
    let name_secret: Field = 0x63686968697261;
    let wrong_secret: Field = 0x7975626162;
    let salt: Field = 0x1234abcd;
    let name_commit = std::hash::poseidon2_permutation([name_secret, salt, 0, 0], 4)[0];
    main(wrong_secret, salt, name_commit);
}

#[test(should_fail)]
fn test_wrong_salt_rejected() {
    let name_secret: Field = 0x63686968697261;
    let salt: Field = 0x1234abcd;
    let wrong_salt: Field = 0xdeadbeef;
    let name_commit = std::hash::poseidon2_permutation([name_secret, salt, 0, 0], 4)[0];
    main(name_secret, wrong_salt, name_commit);
}

#[test(should_fail)]
fn test_tampered_commit_rejected() {
    let name_secret: Field = 0x63686968697261;
    let salt: Field = 0x1234abcd;
    let real_commit = std::hash::poseidon2_permutation([name_secret, salt, 0, 0], 4)[0];
    let fake_commit = real_commit + 1;
    main(name_secret, salt, fake_commit);
}

#[test]
fn show_commit() {
    let name_secret: Field = 0x000000000000000000000000000000000000000000000000006368696869726f;
    let salt: Field = 0x000000000000000000000000000000000000000000000000000000001234abcd;
    let commit = std::hash::poseidon2_permutation([name_secret, salt, 0, 0], 4)[0];
    println(f"nameCommit = {commit}");
}
