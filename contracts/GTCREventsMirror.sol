/**
 *  @authors: [@mtsalenc]
 *  @reviewers: []
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */
pragma solidity ^0.7.0;

/**
 *  @title GTCREventsMirror
 *  This contract is a tool to allow mirroring events from a contract into a another. This is useful to publish information to a subgraph of events that happen in a chain it is not synced to.
 *  @dev This contract was developed with upgradeability in mind. Please review the proxy upgrade pattern to learn about its limitations.
 */
contract GTCREventsMirror {
  address public oracle;
  address public admin; // Note that is not the proxy administrator.
  bool public initialized;

  /**
   *  @dev Emitted when a party makes a request, raises a dispute or when a request is resolved.
   *  @param _itemID The ID of the affected item.
   *  @param _requestIndex The index of the request.
   *  @param _roundIndex The index of the round.
   *  @param _disputed Whether the request is disputed.
   *  @param _resolved Whether the request is executed.
   */
  event ItemStatusChange(
    bytes32 indexed _itemID,
    uint indexed _requestIndex,
    uint indexed _roundIndex,
    bool _disputed,
    bool _resolved
  );

  modifier afterInitialized {require(initialized, "Contract must be initialzied."); _;}

  modifier onlyOracle {require(msg.sender == oracle, "The caller must be the oracle."); _;}

  modifier onlyAdmin {require(msg.sender == admin, "The caller must be the administrator."); _;}

  /** @dev The contract initializer. This does the job of the constructor (which cannot be used with the proxy upgrade pattern).
   */
  function initialize() external {
    require(!initialized, "Contract is already initialized");
    oracle = msg.sender;
    admin = msg.sender;
    initialized = true;
  }

  /** @dev Update the oracle trusted to relay events.
   *  @param _newOracle The address of the new trusted oracle.
   */
  function changeOracle(address _newOracle) external onlyAdmin {
    oracle = _newOracle;
  }

  /** @dev Update the contract administrator. Note that this is not the proxy contract administrator.
   *  @param _newAdmin The address of the new contract admin.
   */
  function changeAdmin(address _newAdmin) external onlyAdmin {
    admin = _newAdmin;
  }

  /** @dev Relay an item status chain event.
   *  @param _itemID The ID of the affected item.
   *  @param _requestIndex The index of the request.
   *  @param _roundIndex The index of the round.
   *  @param _disputed Whether the request is disputed.
   *  @param _resolved Whether the request is executed.
   */
  function emitItemStatusChange(
    bytes32 _itemID,
    uint _requestIndex,
    uint _roundIndex,
    bool _disputed,
    bool _resolved
  ) external onlyOracle afterInitialized {
    emit ItemStatusChange(_itemID, _requestIndex, _roundIndex, _disputed, _resolved);
  }
}
