pragma solidity 0.5.16;

contract PlantManager {

  enum SourceType {undefined, seed, clone}
  struct PlantStruct {
    address id;
    SourceType source;
    uint256 THC_CBD;
  }
  PlantStruct[] plantList;
  mapping (address=>uint) public plantIndex;
  
  address[] plants;
  
  constructor() public {
      addPlant(address(0x0),SourceType.undefined, 0 );  //posicao 0 zerada
  }

  function inPlantList (address _address) public view returns (bool) {
      if (plantIndex[_address] > 0)
          return true;
      else
          return false;
  }

  event AddPlant (address indexed _address);

  function addPlant (address _id, SourceType _source, uint _THC_CBD) public returns (uint256) {
    require (!inPlantList(_id), "Plant exists");

    PlantStruct memory plant = PlantStruct({
        id: _id,
        source: _source,
        THC_CBD: _THC_CBD
    });

    plantIndex[_id] = plantList.push(plant)-1;
    emit AddPlant(_id);
    return plantIndex[_id];
  }

  function getPlant (address _id) public view returns (SourceType source, uint THC_CBD) {
      require (inPlantList(_id), "Plant not exists");
      uint index = plantIndex[_id];
      source = plantList[index].source;
      THC_CBD = plantList[index].THC_CBD;
      return (source, THC_CBD);
  }
  
  function listPlants() public view returns (address[] memory) {
      return plants;
  }  

}
