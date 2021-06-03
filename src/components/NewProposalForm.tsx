import React from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import styled from 'styled-components';
import { observer } from 'mobx-react';
import { useStores } from '../contexts/storesContext';
import { ZERO_ADDRESS, ANY_ADDRESS, ANY_FUNC_SIGNATURE, ERC20_TRANSFER_SIGNATURE } from '../utils/helpers';
import ActiveButton from '../components/common/ActiveButton';
import MDEditor, { commands } from '@uiw/react-md-editor';
import { useHistory } from "react-router-dom";
import contentHash from 'content-hash';

const NewProposalFormWrapper = styled.div`
  width: cacl(100% -40px);
  background: white;
  padding: 0px 10px;
  font-weight: 400;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  flex-direction: column;
`;

const SchemeInput = styled.div`
    width: 100%;
    display: flex;
    justify-content: left;
    flex-direction: row;
    margin-bottom: 10px;
    
    label {
      text-align: center;
      font-family: Roboto;
      font-style: normal;
      font-weight: 500;
      font-size: 20px;
      line-height: 18px;
      padding: 10px 10px;
    }
    
    select {
      background-color: white;
      max-width: 500px;
      width: 100%;
      height: 30px;
      margin-top: 5px;
      border-radius: 3px;
      border: 1px solid gray;
    }
`;

const TitleInput = styled.div`
    width: 100%;
    display: flex;
    justify-content: left;
    flex-direction: row;
    margin-bottom: 10px;
    
    span {
      text-align: center;
      font-family: Roboto;
      font-style: normal;
      font-weight: 500;
      font-size: 20px;
      line-height: 18px;
      padding: 10px 10px;
    }
    
    input {
      max-width: 500px;
      width: 100%;
      height: 25px;
      margin-top: 5px;
      border-radius: 3px;
      border: 1px solid gray;
    }
`;

const TextActions = styled.div`
    width: 100%;
    display: flex;
    justify-content: left;
    flex-direction: column;
    margin: 10px 0px;
    line-height: 30px;
    
`;

const CallRow = styled.div`
    width: 100%;
    display: flex;
    justify-content: left;
    flex-direction: row;
    margin-bottom: 10px;
    
    span {
      text-align: center;
      font-family: Roboto;
      font-style: normal;
      font-weight: 500;
      font-size: 20px;
      line-height: 18px;
      padding: 10px 10px;
    }
`;

const RemoveButton = styled.div`
    background-color: grey;
    border: 1px solid black;
    border-radius: 10px;
    color: white;
    height: 25px;
    letter-spacing: 1px;
    font-weight: 500;
    line-height: 25px;
    text-align: center;
    cursor: pointer;
    width: max-content;
    padding: 0px 5px;
    margin: 5px;
`;

const AddButton = styled.div`
    background-color: var(--blue-text);
    border: 1px solid black;
    border-radius: 10px;
    color: white;
    height: 25px;
    letter-spacing: 1px;
    font-weight: 500;
    line-height: 25px;
    text-align: center;
    cursor: pointer;
    width: max-content;
    padding: 0px 5px;
    margin: 5px;
`;

const CallInput = styled.input`
  width: ${(props) => props.width || '25%'};
  max-width: 500px;
  height: 34px;
  border-radius: 3px;
  border: 1px solid gray;
  margin-right: 5px;
`;

const NewProposalForm = observer(() => {
    let history = useHistory();

    const {
        root: { providerStore, daoStore, configStore, daoService, ipfsService, pinataService, blockchainStore },
    } = useStores();
    
    const { active, account } = providerStore.getActiveWeb3React();
    
    const schemes = daoStore.getAllSchemes();
    const networkConfig = configStore.getNetworkConfig()

    const [schemeToUse, setSchemeToUse] = React.useState(schemes[0]);
    const [titleText, setTitleText] = React.useState("");
    const [ipfsHash, setIpfsHash] = React.useState("");
    const [uploadedToIPFS, setUploadedToIPFS] = React.useState(false);
    const [descriptionText, setDescriptionText] = React.useState("");
    const [calls, setCalls] = React.useState([]);
    const [submitionState, setSubmitionState] = React.useState(0);
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    
    const uploadToIPFS = async function() {
      const hash = await ipfsService.add(descriptionText);
      setIpfsHash(hash);
      if (pinataService.auth) {
        const pinataUpload = await pinataService.pin(hash);
        console.debug('[PINATA UPLOAD]', pinataUpload.data)
      }
      await ipfsService.pin(hash);
      setUploadedToIPFS(true);
    }
    
    const createProposal = async function() {
      
      console.debug('[RAW PROPOSAL]', schemeToUse, calls, titleText, ipfsHash);

      const { library } = providerStore.getActiveWeb3React();
      
      try {
        const callToController = (schemeToUse.controllerAddress == networkConfig.controller);
        
        const to = calls.map((call) => {
          return callToController ? networkConfig.controller : call.to;
        });

        const data = calls.map((call) => {
          if (call.to == "")
            return "";
          const parameters = (call.callType === "simple" && (call.functionName.length > 0 && call.functionParams.length > 0))
            ? call.functionName.substring(
              call.functionName.indexOf("(") + 1, call.functionName.lastIndexOf(")")).split(",")
            : [];  

          const simpleData = 
            call.callType === "simple" && call.functionName.length > 0 ? 
            library.eth.abi.encodeFunctionSignature(call.functionName) + 
            library.eth.abi.encodeParameters(parameters, call.functionParams.split(",")).substring(2)
            : "0x0"
          
          if (callToController && call.to != networkConfig.controller) {
            return daoService.encodeControllerGenericCall(
              call.to,
              simpleData,
              call.callType === "simple" ? library.utils.toWei(call.value).toString()
              : call.value
            )
          } else {
            return simpleData;
          }
        });

        const value = calls.map((call) => {
          return callToController ? "0"
          : call.callType === "simple" ? library.utils.toWei(call.value).toString()
            : call.value
        });
        
        console.debug('[PROPOSAL]', schemeToUse.address, to, data, value, titleText, contentHash.fromIpfs(ipfsHash))
        daoStore.createProposal(schemeToUse.address, to, data, value, titleText, contentHash.fromIpfs(ipfsHash));
        setSubmitionState(1);
        // history.push("/");
      } catch (error) {
        console.error(error)
        setSubmitionState(2);
      }
      
    }
    
    function onDescriptionChange(newValue) {
      if (!uploadedToIPFS) {
        setDescriptionText(newValue);
      }
    }
    
    function onTitleChange(newValue) {
      if (newValue.target.value == "dxtest") {
        setTitleText(`Test Proposal for ${account}`);
        setDescriptionText(`## Test Proposal \n Send 0.0006666 ETH, 0.0006666 DXD and minting 666 REP to ${account}`);
      } else {
        setCalls([{"callType":"advanced","to":account,"data":"0x0","functionName":"","functionParams":"","value":"666000000000000000000","allowedFunctions":[]},{"callType":"simple","to":networkConfig.votingMachineToken,"data":"","functionName":"transfer(address,uint256)","functionParams":`${account},666000000000000000000`,"value":"0","allowedFunctions":[{"value":"transfer(address,uint256)","label":"transfer(address to ,uint256 value)"},{"value":"approve(address,uint256)","label":"approve(address to,uint256 value)"},{"value":"transferFrom(address,address,uint256)","label":"transferFrom(address from ,address to,uint256 value)"}]},{"callType":"simple","to":networkConfig.controller,"data":"","functionName":"mintReputation(uint256,address,address)","functionParams":`666,${account},${networkConfig.avatar}`,"value":"0","allowedFunctions":[{"value":"mintReputation(uint256,address,address)","label":"mintReputation(uint256 _amount, address _to, address _avatar)"},{"value":"burnReputation(uint256,address,address)","label":"burnReputation(uint256 _amount, address _from, address _avatar)"},{"value":"registerScheme(address,bytes32,bytes4,address)","label":"registerScheme(address _scheme, bytes32 _paramsHash, bytes4 _permissions, address _avatar)"},{"value":"unregisterScheme(address,address)","label":"unregisterScheme(address _scheme, address _avatar)"},{"value":"genericCall(address,bytes,addres,uint256)","label":"genericCall(address _contract, bytes calldata _data, Avatar _avatar, uint256 _value)"}]}])
        setTitleText(newValue.target.value);
      }
    }
    
    let callToAny = false;
    let callAnyFunction = false;
    let allowedToCall = [];
    
    if (schemeToUse.controllerAddress == networkConfig.controller) {
      allowedToCall.push({ value: networkConfig.controller, label: `DXController ${networkConfig.controller}` });
    }
    // TO DO: Check that the permission regsitry is allowed, we assume it is
    allowedToCall.push({ value: networkConfig.permissionRegistry, label: `PermissionRegistry ${networkConfig.permissionRegistry}` });
    allowedToCall.push({ value: networkConfig.votingMachineToken, label: `DXD ${networkConfig.votingMachineToken}` });
    
    // Add ERC20 tokens
    if (networkConfig.tokens)
      Object.keys(networkConfig.tokens).map((tokenAddress) => {
        allowedToCall.push({
          value: tokenAddress,
          label: `${networkConfig.tokens[tokenAddress].name} ${tokenAddress}`
        });
      });

    function addCall() {
      calls.push({
        callType: "simple",
        allowedFunctions: [],
        to: "",
        data: "",
        functionName: "",
        functionParams: "",
        value: ""
      })
      setCalls(calls);
      forceUpdate()
    };
    
    function removeCall(proposalIndex) {
      calls.splice(proposalIndex, 1);
      setCalls(calls)
      forceUpdate();
    };
    
    function changeCallType(proposalIndex) {
      calls[proposalIndex] = {
        callType: calls[proposalIndex].callType === "simple" ? "advanced" : "simple",
        to: "",
        data: "",
        functionName: "",
        functionParams: "",
        value: ""
      }
      setCalls(calls)
      forceUpdate();
    };
    
    function onToSelectChange(callIndex, toAddress) {
      if (toAddress.value && toAddress.value.length > 0) {

        calls[callIndex].to = toAddress.value;
        calls[callIndex].allowedFunctions = [];
        if (toAddress.value == networkConfig.controller) {
          calls[callIndex].allowedFunctions.push({
            value: "mintReputation(uint256,address,address)",
            label: "mintReputation(uint256 _amount, address _to, address _avatar)"
          });
          calls[callIndex].allowedFunctions.push({
            value: "burnReputation(uint256,address,address)",
            label: "burnReputation(uint256 _amount, address _from, address _avatar)"
          });
          calls[callIndex].allowedFunctions.push({
            value: "registerScheme(address,bytes32,bytes4,address)",
            label: "registerScheme(address _scheme, bytes32 _paramsHash, bytes4 _permissions, address _avatar)"
          });
          calls[callIndex].allowedFunctions.push({
            value: "unregisterScheme(address,address)",
            label: "unregisterScheme(address _scheme, address _avatar)"
          });
          calls[callIndex].allowedFunctions.push({
            value: "genericCall(address,bytes,addres,uint256)",
            label: "genericCall(address _contract, bytes calldata _data, Avatar _avatar, uint256 _value)"
          });
        } else if (toAddress.value == networkConfig.permissionRegistry) {
          if (schemeToUse.controllerAddress == networkConfig.controller) {
            calls[callIndex].allowedFunctions.push({
              value: "setTimeDelay(uint256)",
              label: "setTimeDelay(uint256 newTimeDelay)"
            });
            calls[callIndex].allowedFunctions.push({
              value: "setAdminPermission(address,address,address,bytes4,uint256,bool)",
              label: "setAdminPermission(address asset, address from, address to, bytes4 functionSignature, uint256 valueAllowed, bool allowed)"
            });
          } else {
            calls[callIndex].allowedFunctions.push({
              value: "setPermission(address,address,bytes4,uint256,bool)",
              label: "setPermission(address asset, address to, bytes4 functionSignature, uint256 valueAllowed, bool allowed)"
            });
          }
        } else if ((toAddress.value == networkConfig.votingMachineToken) || networkConfig.tokens[toAddress.value]) {
          calls[callIndex].allowedFunctions.push({ value: "transfer(address,uint256)", label: `transfer(address to ,uint256 value)` });
          calls[callIndex].allowedFunctions.push({ value: "approve(address,uint256)", label: `approve(address to,uint256 value)` });
          calls[callIndex].allowedFunctions.push({ value: "transferFrom(address,address,uint256)", label: `transferFrom(address from ,address to,uint256 value)` });
        } else {
          schemeToUse.callPermissions.map((callPermission) => {
            if ((callPermission.asset == ZERO_ADDRESS) && (callPermission.to == toAddress.value)){
              if (callPermission.functionSignature == ANY_FUNC_SIGNATURE)
                callAnyFunction = true;
              else
                calls[callIndex].allowedFunctions.push({ value: callPermission.functionSignature, label: callPermission.functionSignature });
            } else if (callPermission.asset == toAddress.value) {
              calls[callIndex].allowedFunctions.push({ value: "transfer(address,uint256)", label: `transfer(address to ,uint256 value)` });
              calls[callIndex].allowedFunctions.push({ value: "approve(address,uint256)", label: `approve(address to,uint256 value)` });
              calls[callIndex].allowedFunctions.push({ value: "transferFrom(address,address,uint256)", label: `transferFrom(address from ,address to,uint256 value)` });
            }
          });
        }
        
        setCalls(calls)
        forceUpdate();
      }
    }
    
    function onFunctionSelectChange(callIndex, functionSelected) {
      if (functionSelected && functionSelected.value) {
        calls[callIndex].functionName = functionSelected.value;
        setCalls(calls)
        forceUpdate();
      }
    }
    
    function onFunctionParamsChange(callIndex, event) {
      calls[callIndex].functionParams = event.target.value;
      setCalls(calls)
      forceUpdate();
    }
    
    function onValueChange(callIndex, event) {
      calls[callIndex].value = event.target.value;
      setCalls(calls)
      forceUpdate();
    }
    
    function onCallDataChange(callIndex, event) {
      calls[callIndex].data = event.target.value;
      setCalls(calls)
      forceUpdate();
    }
    
    function onSchemeChange(event) {
      setSchemeToUse(schemes[event.target.value]);
      calls.splice(0, calls.length);
      setCalls(calls)
      forceUpdate();
    }
    
    schemeToUse.callPermissions.map((callPermission) => {
      if (callPermission.asset == ZERO_ADDRESS)
        if (callPermission.to == ANY_ADDRESS){
          callToAny = true;
          allowedToCall.push({ value: "", label: "Custom" });
          if (callPermission.functionSignature == ANY_FUNC_SIGNATURE)
            callAnyFunction = true;
        }
        else
          allowedToCall.push({ value: callPermission.to, label: callPermission.to });
      else
        allowedToCall.push({ value: callPermission.asset, label: `ERC20 ${callPermission.asset}` });
    });
    
    return (
      <NewProposalFormWrapper>
        <div style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between"
        }}>
          <SchemeInput>
            <label>Choose a Scheme:</label>
            <select name="scheme" id="schemeSelector" onChange={onSchemeChange}>
            {schemes.map((scheme, i) =>{
              return <option key={scheme.address} value={i}>{scheme.name}</option>
            })}
            </select>
          </SchemeInput>
          <div style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between"
          }}>
          <ActiveButton route="/?view=schemes">Schemes</ActiveButton>
          <ActiveButton route="/?view=proposals">Proposals</ActiveButton>
          <ActiveButton route="/?view=dao">DAO</ActiveButton>
          </div>
        </div>
        <TitleInput>
          <span>Title:</span>
          <input type="text" onChange={onTitleChange} value={titleText}/>
        </TitleInput>
        <MDEditor
          value={descriptionText}
          onChange={onDescriptionChange}
          preview="edit"
          height="300"
          minheights="300"
          maxheights="1000"
          commands={[
            commands.bold,
            commands.italic,
            commands.strikethrough,
            commands.hr,
            commands.title,
            commands.divider,
            commands.link,
            commands.quote,
            commands.code,
            commands.image,
            commands.unorderedListCommand,
            commands.orderedListCommand,
            commands.checkedListCommand,
          ]}
        />
        <h2>Description Preview:</h2>
        <MDEditor.Markdown source={descriptionText} style={{
          backgroundColor: "white",
          borderRadius: "5px",
          border: "1px solid gray",
          padding: "20px 10px"
        }} />
        {schemeToUse.controllerAddress == networkConfig.controller ?
          <h2>Calls executed from the avatar:</h2>
          :<h2>Calls executed from the scheme:</h2>
        }
        {calls.map((call, i) => 
          <CallRow key={"call"+i}>
            <span>#{i}</span>
            {callToAny ?
              <CreatableSelect
                id={`toSelector${i}`}
                styles={{
                  option: (provided, state) => ({ ...provided, fontSize: '12px', }),
                  control: (provided, state) => ({
                    alignItems: "center",
                    display: "flex",
                    position: "relative",
                    borderRadius: "3px",
                    border: "1px solid gray"
                  }),
                  container: (provided, state) => ({ ...provided, 
                    width: "20%",
                    marginRight: "5px"
                  }),
                  indicatorSeparator: (provided, state) => ({ ...provided, backgroundColor: "white" }),
                  singleValue: (provided, state) => ({ ...provided, fontSize: '12px', })
                }}
                className="toSelector"
                options={allowedToCall}
                onChange={(value) => onToSelectChange(i, value)}
                onInputChange={(value) => onToSelectChange(i, value)}
              />
            : 
              <Select
                id={`toSelector${i}`}
                styles={{
                  option: (provided, state) => ({ ...provided, fontSize: '12px', }),
                  control: (provided, state) => ({
                    alignItems: "center",
                    display: "flex",
                    position: "relative",
                    borderRadius: "3px",
                    border: "1px solid gray"
                  }),
                  container: (provided, state) => ({ ...provided, 
                    width: "20%",
                    marginRight: "5px"
                  }),
                  indicatorSeparator: (provided, state) => ({ ...provided, backgroundColor: "white" }),
                  singleValue: (provided, state) => ({ ...provided, fontSize: '12px', })
                }}
                className="toSelector"
                options={allowedToCall}
                onChange={(value) => onToSelectChange(i, value)}
              />
            }
            { call.callType === "advanced"
              ? <CallInput 
                type="text"
                onChange={(value) => onCallDataChange(i, value)}
                value={call.data}
                placeholder="0x..."
                width="50%"
              />
              : <div style={{display: "flex", width: "50%"}}>
                {callAnyFunction ?
                  <CreatableSelect
                    id={`functionSelector${i}`}
                    styles={{
                      option: (provided, state) => ({ ...provided, fontSize: '12px', }),
                      control: (provided, state) => ({
                        alignItems: "center",
                        display: "flex",
                        position: "relative",
                        borderRadius: "3px",
                        border: "1px solid gray"
                      }),
                      container: (provided, state) => ({ ...provided, 
                        width: "40%",
                        marginRight: "5px"
                      }),
                      indicatorSeparator: (provided, state) => ({ ...provided, backgroundColor: "white" }),
                      singleValue: (provided, state) => ({ ...provided, fontSize: '12px', })
                    }}
                    className="functionSelector"
                    options={calls[i].allowedFunctions}
                    onChange={(value, action) => onFunctionSelectChange(i, value, action)}
                    onInputChange={(value, action) => onFunctionSelectChange(i, value, action)}
                  />
                : <Select
                    id={`functionSelector${i}`}
                    styles={{
                      option: (provided, state) => ({ ...provided, fontSize: '12px', }),
                      control: (provided, state) => ({
                        alignItems: "center",
                        display: "flex",
                        position: "relative",
                        borderRadius: "3px",
                        border: "1px solid gray"
                      }),
                      container: (provided, state) => ({ ...provided, 
                        width: "40%",
                        marginRight: "5px"
                      }),
                      indicatorSeparator: (provided, state) => ({ ...provided, backgroundColor: "white" }),
                      singleValue: (provided, state) => ({ ...provided, fontSize: '12px', })
                    }}
                    className="functionSelector"
                    onChange={(value, action) => onFunctionSelectChange(i, value, action)}
                    onChange={(value) => onFunctionSelectChange(i, value)}
                  />
                }
                <CallInput 
                  type="text"
                  onChange={(value) => onFunctionParamsChange(i, value)}
                  value={calls[i].functionParams}
                  placeholder="functions values separated with commas"
                  width="60%"
                />
              </div>
            }
            
            <CallInput
              type="text"
              onChange={(value) => onValueChange(i, value)}
              value={calls[i].value}
              width="10%"
              placeholder={calls[i].callType === "advanced" ? "WEI" : "ETH"}
            />
            
            <RemoveButton onClick={() => {removeCall(i)}}>X</RemoveButton>
            <RemoveButton onClick={() => {changeCallType(i)}}> {calls[i].callType === "advanced" ? "Simple" : "Advanced"} </RemoveButton>
          </CallRow>
        )}
        
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center"}}>
          <ActiveButton onClick={addCall}>Add Call</ActiveButton>
        </div>
        
        <TextActions>
          {uploadedToIPFS ?
            <span>
              Uploaded to pinata:
                <a href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`} target="_blank">https://gateway.pinata.cloud/ipfs/{ipfsHash}</a>
              <br/>
              Check before submitting proposal
            </span>
            : <div/>
          }
          { (submitionState == 1) ?
            <span>Proposal is correct</span>
            : (submitionState == 2) ?
            <span>Error when trying to submit proposal</span>
            : <div/>
          }
        </TextActions>
        
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center"}}>
          <ActiveButton onClick={ (!uploadedToIPFS) ? uploadToIPFS : createProposal}>
            { (!uploadedToIPFS) ? "Upload to IPFS" : "Submit Proposal" }
          </ActiveButton>
        </div>
        
      </NewProposalFormWrapper>
    );
});

export default NewProposalForm;
