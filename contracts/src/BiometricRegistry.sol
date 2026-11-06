// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title BiometricRegistry
/// @notice On-chain enrollment record + fresh-nonce / TTL access policy for FacePay.
/// @dev Stores NO biometric data — only a commitment hash and policy metadata.
contract BiometricRegistry is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    struct Enrollment {
        bytes32 commitment; // keccak/sha of the encrypted template + salt
        uint64 enrolledAt;
        bool active;
    }

    mapping(address => Enrollment) public enrollments;
    mapping(address => uint256) public lastNonce;
    mapping(address => uint256) public nonceExpiry;

    uint256 public ttl = 3600; // seconds

    event Enrolled(address indexed user, bytes32 commitment, uint64 timestamp);
    event Revoked(address indexed user);
    event NonceIssued(address indexed user, uint256 nonce, uint256 expiry);
    event NonceConsumed(address indexed user, uint256 nonce);
    event TtlUpdated(uint256 ttl);

    constructor(address verifier) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        if (verifier != address(0) && verifier != msg.sender) {
            _grantRole(VERIFIER_ROLE, verifier);
        }
    }

    /// @notice Record (or update) an enrollment commitment for a user.
    function enroll(address user, bytes32 commitment) external onlyRole(VERIFIER_ROLE) {
        enrollments[user] = Enrollment({
            commitment: commitment,
            enrolledAt: uint64(block.timestamp),
            active: true
        });
        emit Enrolled(user, commitment, uint64(block.timestamp));
    }

    /// @notice Deactivate a user's enrollment.
    function revoke(address user) external onlyRole(VERIFIER_ROLE) {
        enrollments[user].active = false;
        emit Revoked(user);
    }

    /// @notice Issue a fresh, monotonically increasing authorization nonce with a TTL.
    function issueNonce(address user) external onlyRole(VERIFIER_ROLE) returns (uint256 nonce) {
        require(enrollments[user].active, "not enrolled");
        nonce = ++lastNonce[user];
        uint256 expiry = block.timestamp + ttl;
        nonceExpiry[user] = expiry;
        emit NonceIssued(user, nonce, expiry);
    }

    /// @notice Consume the current nonce for a user if valid and unexpired.
    function consumeNonce(address user, uint256 nonce) external onlyRole(VERIFIER_ROLE) {
        require(nonce == lastNonce[user], "stale nonce");
        require(block.timestamp <= nonceExpiry[user], "nonce expired");
        nonceExpiry[user] = 0; // single use
        emit NonceConsumed(user, nonce);
    }

    function setTtl(uint256 newTtl) external onlyRole(DEFAULT_ADMIN_ROLE) {
        ttl = newTtl;
        emit TtlUpdated(newTtl);
    }

    function setVerifier(address verifier, bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (enabled) _grantRole(VERIFIER_ROLE, verifier);
        else _revokeRole(VERIFIER_ROLE, verifier);
    }

    function isEnrolled(address user) external view returns (bool) {
        return enrollments[user].active;
    }

    function getEnrollment(address user) external view returns (Enrollment memory) {
        return enrollments[user];
    }
}
