pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

contract PlantManager {

  struct EIP712Domain {
      string name;
      string version;
      uint256 chainId;
      address verifyingContract;
  }

  struct MetaTransaction {
      uint256 nonce;
      address from;
  }

  mapping(address => uint256) public nonces;

  bytes32 internal constant EIP712_DOMAIN_TYPEHASH = keccak256(bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"));
  bytes32 internal constant META_TRANSACTION_TYPEHASH = keccak256(bytes("MetaTransaction(uint256 nonce,address from)"));
  bytes32 internal DOMAIN_SEPARATOR = keccak256(abi.encode(
      EIP712_DOMAIN_TYPEHASH,
      keccak256(bytes("PlantManager")),
      keccak256(bytes("1")),
      80001, // Matic Mumbai
      address(this)
  ));  

  struct PlantStruct {
    uint256 id;
    address owner;
    uint256 thc;
    uint256 cbd;
  }
  PlantStruct[] plantsList;

  uint256 private lastId;

  constructor() public {
      lastId = 0;
  }

  event AddPlant (uint256 _id, address indexed _owner, uint256 _thc, uint256 _cbd);

  function getNonce(address _address) public view returns (uint256 nonce)
  {
      nonce = nonces[_address];
  }

  function addPlantMeta (address userAddress, uint256 _thc, uint256 _cbd, bytes32 r, bytes32 s, uint8 v) 
    public returns (uint256) {

    MetaTransaction memory metaTx = MetaTransaction({nonce: nonces[userAddress],from: userAddress});

    bytes32 digest = keccak256(
        abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            keccak256(abi.encode(META_TRANSACTION_TYPEHASH, metaTx.nonce, metaTx.from))
        )
    );

    require(userAddress != address(0), "invalid-address-0");
    require(userAddress == ecrecover(digest, v, r, s), "invalid-signatures");    

    lastId = lastId+1;

    PlantStruct memory plant = PlantStruct({
        id: lastId,
        owner: userAddress,
        thc: _thc,
        cbd: _cbd
    });
    plantsList.push(plant);

    nonces[userAddress]++;

    emit AddPlant(lastId, userAddress, _thc, _cbd);
    return lastId;
  }

  function addPlant (address _owner, uint256 _thc, uint256 _cbd) 
    public returns (uint256) {
        
    lastId = lastId+1;

    PlantStruct memory plant = PlantStruct({
        id: lastId,
        owner: _owner,
        thc: _thc,
        cbd: _cbd
    });
    plantsList.push(plant);

    emit AddPlant(lastId, _owner, _thc, _cbd);
    return lastId;
  }

  function getPlant (uint256 _id) public view 
    returns (address owner, uint256 thc, uint256 cbd) {
        require ( (_id > 0) && (_id <= lastId), "invalid id");
        uint256 index = _id - 1; 
      owner = plantsList[index].owner;
      thc = plantsList[index].thc;
      cbd = plantsList[index].cbd;
      return (owner, thc, cbd);
  }
  
  function getLastId() public view returns (uint256) {
      return (lastId);
  }
  
  function listPlants() public view returns (PlantStruct[]memory) {
      return plantsList;
  }
}
