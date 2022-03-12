# @pods-finance/subgraph
🔮 A subgraph implementation for the Pods v2 contracts. The "light" flavour excludes extra analytics.

[Mainnet](https://thegraph.com/legacy-explorer/subgraph/pods-finance/pods)
| [Kovan](https://thegraph.com/legacy-explorer/subgraph/pods-finance/pods-kovan)
| [Goerli](https://thegraph.com/legacy-explorer/subgraph/pods-finance/pods-goerli)
| [Matic](https://thegraph.com/legacy-explorer/subgraph/pods-finance/pods-matic)
| [Arbitrum](https://thegraph.com/legacy-explorer/subgraph/pods-finance/pods-arbitrum)
| [Optimism](https://thegraph.com/legacy-explorer/subgraph/pods-finance/pods-optimism)
| [Fantom](https://thegraph.com/legacy-explorer/subgraph/pods-finance/pods-fantom)
| [Avalanche](https://thegraph.com/legacy-explorer/subgraph/pods-finance/pods-avalanche)





Table of Contents
=================

* [@pods-finance/subgraph](#pods-financesubgraph)
   * [Definitions](#definitions)
   * [Entities](#entities)
   * [Technical Specs](#technical-specs)

## Definitions
The subgraph will track and serve protocol entities (e.g. options, pools), user actions (e.g. buy, mint), user positions (e.g. premium earned).

The main entry point is the configuration manager address. The manager will keep track of global variables and whitelisted factories (for options and pools) and will track any meaningful interaction with these contracts.

---
## Entities

#### Option
A representation of a put/call option instrument (address, underlying asset, strike asset, strike price etc.).

#### Pool
A representation of an AMM pool, trading between one type of option tokens and stablecoins (premium tokens).

#### Action
The **action** entity will track interactions with the helper contract. The following will be regarded as actions:

| | | | | | | | | |
| - | - | - | - | - | - | - | - | - |
| Buy | Sell | Resell | Add | Remove |Mint | Unmint | Exercise | Withdraw |

[*] Two extra actions may be take into account: *TransferTo* and *TransferFrom*.

Every one of these actions will make use of 4 variables: `inputTokenA`, `inputTokenB`, `outputTokenA`, `outputTokenB`. These will store the amounts of tokens either sent or received for the action in question. These values are padded with decimals, so the developer will have to resolve them to their humanized form.

For simplicity, we'll use the `U:S` or underlying:strike (e.g. ETH:USDC) to showcase each action. The `OT` symbol will denote the option token.



##### Tracking put(s)

[*] Even though adding liquidity will be done with stablecoins only (in the case of a put), we'll track the balances of token A and token B after they are separated.

| # | Type/Classification | Action | InputTokenA | InputTokenB | OutputTokenA | OutputTokenB |
| - | ------------------- | ------ | ----------- | ----------- | ------------ | ------------ |
| 1 | put | buy |  | premium (S) | options (OT) |  |
| 2 | put | sell |  | collateral (S) |  | premium (S) |
| 3 | put | resell | options (OT) | |  | premium (S) |
| 4 | put | add^2 | options (OT) | stablecoins (S) | | |
| 5 | put | remove | | | options (OT) | stablecoins (S) |
| 6 | put | mint |  | collateral (S) | options (OT)  | |
| 7 | put | unmint | options (OT) |  | | collateral (S) |
| 8 | put | exercise | underlying (U) | | | collateral (S) |
| 9 | put | withdraw | | | underlying (U) | collateral (S)
| 10 | *put* | *transferTo* | | | *options (OT)* | |
| 11 | *put* | *transferFrom* | *options (OT)* | | | |


##### Tracking call(s)

| # | Type/Classification | Action | InputTokenA | InputTokenB | OutputTokenA | OutputTokenB |
| - | ------------------- | ------ | ----------- | ----------- | ------------ | ------------ |
| 1 | call | buy | | premium (S) | options (OT) | |
| 2 | call | sell | collateral (U) | | | premium (S) |
| 3 | call | resell | options (OT) | |  | premium (S) |
| 4 | call | add^2 | options (OT) | stablecoins (S) | | |
| 5 | call | remove | | | options (OT) | stablecoins (S) |
| 6 | call | mint | collateral (U) | | options (OT) | |
| 7 | call | unmint | options (OT) |  | collateral (U) | |
| 8 | call | exercise | options (OT) | strike (S) | underlying (U) | |
| 9 | call | withdraw | | |  collateral (U) | strike (S) |
| 10 | *call* | *transferTo* | | | *options (OT)* | |
| 11 | *call* | *transferFrom* | *options (OT)* | | | |

##### Advanced data

For advanced metrics we'll be tracking certain parameters affected by each transaction happening in the pool (e.g. fee volumes, implied volatility or TVL).


#### Manager and Configurations
The configuration manager will be represented by the Manager entity. Each manager will have a specific configuration that can be updated. The subgraph tracks every change, while keeping a pointer to the latest one.

#### User
An entity tracking each individual address that interacts with the contracts. This user will have an array of positions and an array of actions.

#### Position
A position is a 1:1 link between a user and an option. These individual position will be created and updated after every interaction of the user with the option (or connected pool).

Some examples of the parameters stored in the position are (but not limited to):
- amount of options sold
- amount of options bought
- amount of premium earned
- amount of option tokens provided
#### Others
We'll use some other helper entities such as Spot Price, Pool Factory, Option Factory.

---
## Technical Specs
#### Deployment Procedure
0. `yarn run codegen` (if there were changes to the schema.graphql)
1. `yarn deploy:kovan --access-token XXXXXXX` (the $VARIANT here is kovan | for the access token, see the dashboard for the pods account) 
#### Configuration

The configuration variables (e.g. the manager address or start block) can be managed in `src/constants/addresses` files.

#### Preprocessing

In order to provide a dynamic generation and deploy for the subgraph (multi-network and multi-context), the `yarn deploy:$VARIANT` will include a series of preprocessing steps. The flow:

1. The deploy **variant** will decide the network and the context e.g. `yarn deploy:kovan` will set the $VARIANT variable
2. Based on the chosen variant, the right typescript configuration file will be compiled into a javascript file that will be used as **source** for mustache.<br/>`[yarn configure] src/constants/addresses/$VARIANT.ts → src/_generated/$VARIANT.js`

3. Mustache is used to bind the newly created `src/_generated/$VARIANT.js` configuration to the subgraph YAML template.<br/>`[yarn template 1/2] subgraph.template.yaml → subgraph.yaml`

4. Mustache is used to bind the newly created `src/_generated/#variant#.js` configuration to typescript environment file.<br/>`[yarn template 1/2] src/constants/env.mustache → src/constants/env.ts`

5. Based on the chosen variant, we'll use the $NAME variable to point to the correct subgraph by name and deploy everything.<br/>`[yarn deploy]`

#### Preprocessing caveats

We're initially declaring the coniguration variables in `src/constants/addresses`. We need to 
- bind the config to the `yaml` template and
- bind the config to the `src/constants/index.ts` to access it from the entire project at runtime. 

Because a) mustache can only handle `js` files as **source** and b) assembly script cannot use dotenv, we're implementing this special pre-processing flow to make up for it. Some issues and decisions:

- The `src/_generated` folder is not replaceable by a single `ts` file because mustache is not able to read `ts`. It can only handle `js` files as **source**.
- The `src/_generated` folder is not replaceable by a single `js` file because the `--outFile` flag is not usable with `tsc` when the `--module` flag is CommonJS. We need this so mustache can read the exports.
- AssemblyScript doesn't allow for `js` or `json` files to be imported directly into `ts`
