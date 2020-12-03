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
  mapping(uint => uint) public eventToCount; // Maps an event identifier to the number of events logged. Used to prevent accidental replays.

  // Enums and immutable variables cannot be used with upgradable smart contracts without complexity,
  // so we just use regular variables.
  // See https://docs.openzeppelin.com/upgrades-plugins/1.x/faq#why-cant-i-use-custom-types.
  // and https://docs.openzeppelin.com/upgrades-plugins/1.x/faq#why-cant-i-use-custom-types
  uint public ITEM_STATUS_CHANGE_IDENTIFIER; // Intentionally kept at 0.

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

  /** @dev Relay an item status change events. Items MUST be submitted in the order they were logged in the source chain.
   *  @param _itemIDs The IDs of the affected items.
   *  @param _requestIndexes The indexes of the requests.
   *  @param _roundIndexes The indexes of the rounds.
   *  @param _disputesCreated Whether the requests are disputed.
   *  @param _requestsResolved Whether the request are resolved.
   *  @param _eventCountStart The event count to start logging. Used to prevent accidental duplicate events.
   */
  function emitItemStatusChange(
    bytes32[] memory _itemIDs,
    uint[] memory _requestIndexes,
    uint[] memory _roundIndexes,
    bool[] memory _disputesCreated,
    bool[] memory _requestsResolved,
    uint _eventCountStart
  ) external onlyOracle afterInitialized {
    for (uint i = 0; i < _itemIDs.length; i++) {
      require(_eventCountStart == eventToCount[ITEM_STATUS_CHANGE_IDENTIFIER], "Event already emmited.");
      emit ItemStatusChange(
        _itemIDs[0],
        _requestIndexes[0],
        _roundIndexes[0],
        _disputesCreated[0],
        _requestsResolved[0]
      );
      eventToCount[ITEM_STATUS_CHANGE_IDENTIFIER]++;
    }
  }
}
