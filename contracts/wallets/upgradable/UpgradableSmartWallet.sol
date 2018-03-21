pragma solidity ^0.4.18;
import "./UpgradableSmartWalletLib.sol";
import "./RelayDispatcher.sol";
import "../../token/IERC20Token.sol";

contract UpgradableSmartWallet {

    /*
     *  Members
     */
    using UpgradableSmartWalletLib for UpgradableSmartWalletLib.Wallet;
    UpgradableSmartWalletLib.Wallet public wallet;

    /*
        @dev Initialize the contract

        @param _backupAccount               Operator account to release funds in case the user lost his withdrawal account
        @param _operator                    The operator account
        @param _feesAccount                 The account to transfer fees to
        @param _relayDispatcher             The address of the contract that holds the relay dispatcher
          
    */  
    function UpgradableSmartWallet(address _backupAccount, address _operator, address _feesAccount, address _relayDispatcher) 
        public 
        {
            wallet.initUpgradableSmartWallet(_backupAccount, _operator, _feesAccount, _relayDispatcher);
    }

    /*
        @dev Let the token approve the prediction to transfer funds from this wallet

        @param _token               The ERC20 token the owner withdraws from 
        @param _prediction          The prediction to give approval to 
        @param _amount              Amount to approve for transfer from this wallet to _prediction  
    
    function approvePredictionBuying(IERC20Token _token, address _prediction, uint256 _amount) public returns (bool) {
        return _token.approve(_prediction,_amount);
    }
    */
    
    /*
        @dev Withdraw funds to a backup account. 


        @param _token               The ERC20 token the owner withdraws from 
        @param _amount              Amount to transfer    
    */
    function transferToBackupAccount(IERC20Token _token, uint _amount) public {
        wallet.transferToBackupAccount(_token, _amount);
    }

    /*
        @dev Set a new RelayDispatcher address

        @param _relayDispatcher               RelayDispatcher new address
    */
    function setRelayDispatcher(address _relayDispatcher) public {
        wallet.setRelayDispatcher(_relayDispatcher);
    }

    /*
        @dev Fallback function to delegate calls to the relay contract

    */
    function() public {
        RelayDispatcher relayDispatcher = RelayDispatcher(wallet.relayDispatcher); 
        address relay = relayDispatcher.getSmartWalletImplAddress();
        
        if (!relay.delegatecall(msg.data)) {
           revert();
        }
    }
}
