// SPDX-License-Identifier: MIT

//Feel free to use this code for your own project. 
//Expand the possibilities and continue to build a diverse ecosystem!!
pragma solidity ^0.8.7;


import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


contract TheGuild is  ERC721URIStorage, Ownable{
    
    /*
    Declaring Events for the contract
    These events are used to log transactions that can be veiwed and verified to save gas and time
    */
    //Emits when someone uses the buy() function to mint thier License
    event NewPayment(address indexed sender, uint256 indexed amount);
    //Emits when an admin changes the price
    event NewPriceChange(address indexed admin, uint indexed New);
    //Emits when a user sends a donation using the donation() function
    //which gets stored and used for thanking donars
    event NewDonation(address indexed from, uint256 indexed amount);
    //Emits when an applicant has been approved by a councilmen
    event NewMemberApproved(address indexed recipient, uint indexed id);
    //Emits when a new air drop promo has been issued
    event AirDropPromo(address indexed admin, bool StartorEnd);
    //Emits when a wallet has been selected for an airdrop 
    event AirDropApproved(uint indexed id, address indexed selected);
    //Emits when a airdrop has been claimed 
    event RewardClaimed(address indexed recipient, uint indexed tokenID);
    using Strings for uint256;
    
    /*
    Initialize our state variables 
    */
   
    address _owner;
   
    address[] public airdropque;
     
    mapping(address => uint) public donatorsBalance;
    
    mapping(address => bool) public approved; 
    
    mapping(address => bool) internal airDropApproval;
    
    mapping(address => uint) internal balances;
   
    mapping(address => uint) internal airDropID;
    
    mapping(address => uint) internal buyer;
    
    mapping(address => string) internal airDropName;
  
    mapping(address => string) public buyerName;
    bool public promo = false;
    string baseExtension = "";
    string public customuri;
    uint256 public price;
    uint public count;
    uint public airDropCount;
    


    constructor( 
                string memory name, 
                string memory symbol
               ) ERC721(name, symbol){
      
      _owner = msg.sender;
    }
    /*
      List of functions for admins and users. 
      Most of the functions a Guild member would need for the application proccess will be 
      available here but can also be accessed from our website.
    */

     function setBaseuri(string memory s) public virtual onlyOwner {
       customuri = s;
     }
     function _baseURI() internal view virtual override returns (string memory) {
        return customuri;
    }
    //Triggers new promos as well as being able to end the current promo
    function tooglePromo() public onlyOwner{
      promo = !promo;
      emit AirDropPromo(msg.sender, promo);
    }
    //Pass two arrays to add multiple wallets into the airdrop promo
    function AirDropList(address[] memory s, string[] memory d) public onlyOwner{
      require(promo == true, "No active promo available");
      require(s.length == d.length, "Invalid array size, please check that your arrays are the same size");
        for(uint i=0;i<s.length;i++){
          count++;
          airDropCount++;
          airDropID[s[i]] = count;
          airDropName[s[i]] = string(abi.encodePacked(d[i], baseExtension));
          airDropApproval[s[i]] = true;
          airdropque.push(s[i]);
          emit AirDropApproved(airDropCount, s[i]);
        }
        
    }
    //Clears the list of wallets for an airdrop
    function clearAirDropList() public onlyOwner{
      for(uint i=0; i<airdropque.length;i++){
        airDropID[airdropque[i]] = 0;
        airDropName[airdropque[i]] = "";
        airDropApproval[airdropque[i]] = false;
      }
      delete airdropque;
    }
    //Function to claim an airdrop
    function claimAirDrop() public payable {
      require(airDropApproval[msg.sender] == true);
        if(airDropApproval[msg.sender] == true){
        _safeMint(msg.sender, airDropID[msg.sender]);
        _setTokenURI(airDropID[msg.sender], airDropName[msg.sender]);
        airDropApproval[msg.sender] = false;
        }
      emit RewardClaimed(msg.sender, airDropCount);
    }
     //Pass two arrays to approve multiple wallets to their respectve License
     function whitelistBatch(address[] memory rec, string[] memory name) public onlyOwner { 
      
        for(uint i =0; i< rec.length; i++){  
          count++;
          approved[rec[i]] = true;
          buyerName[rec[i]] = string(abi.encodePacked(name[i], baseExtension));
          buyer[rec[i]] = count;
          emit NewMemberApproved(rec[i], buyer[rec[i]]);
        }
  
     }
     //Function to mint the License for the minimum price
     //Users should enter the payment amount in the value feild 
     //if interacting with the contract directly
     function buy() public payable {
         require(approved[msg.sender] == true,"Current address is not approved.");       
         require(msg.value >= price, "Not enough ether for transaction");
          (bool success,) = payable(address(this)).call{value: msg.value}("");
          //Mints the License when the call passes
          if(success){
          _safeMint(msg.sender, buyer[msg.sender]);
          _setTokenURI(buyer[msg.sender], buyerName[msg.sender]);
          balances[msg.sender] += msg.value;
          approved[msg.sender] = false;
          //Confirms that the payment went through
          emit NewPayment(msg.sender, balances[msg.sender]);
          }
         // reverts the transaction if the payment did not go through 
         require(success, "Transaction was not sent!");
     }
     //Function for changing the price to correlate with the USD
     function setPrice (uint256 _newPrice) external onlyOwner virtual returns (bool){
         require(price != _newPrice, "Please change the price to a new value!");
         
         price = _newPrice * 1 ether;
         emit NewPriceChange(msg.sender, price);
         return true;
    }
     //Function for admin to withdraw funds from the contract 
     function withdraw(address recipient) public payable onlyOwner{
       (bool yes,) = payable(recipient).call{value: address(this).balance}("");
       require(yes, "Something went wrong!");
     }
    //Function for donars to donate their contributions
    //Users should send the donation amount in the value section of the call
     function donation() public payable{
       require(msg.sender.balance > msg.value);
       (bool success,) = payable(address(this)).call{value: msg.value}("");
       if(success){
         donatorsBalance[msg.sender] += msg.value;
         emit NewDonation(msg.sender, msg.value);
       }
     }
  
     function bankroll() public onlyOwner view returns(uint256){
       
       return address(this).balance;
     
     }
   
    receive() external payable{
      
    }
    fallback() external payable {
      
    }

     
}

