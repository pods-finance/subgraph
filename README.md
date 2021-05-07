# subgraph
A subgraph implementation for Pods v2 contracts

## Configuration

The configuration variables (e.g. the manager address or start block) can be managed in `src/addresses` files.

## Preprocessing

In order to provide a dynamic generation and deploy for the subgraph (multi-network and multi-context), the `yarn deploy:$VARIANT` will include a series of preprocessing steps. The flow:

1. The deploy **variant** will decide the network and the context e.g. `yarn deploy:kovan-dev` will set the $VARIANT variable
2. Based on the chosen variant, the right typescript configuration file will be compiled into a javascript file that will be used as **source** for mustache.<br/>`[yarn configure] src/constants/addresses/$VARIANT.ts → src/_generated/$VARIANT.js`

3. Mustache is used to bind the newly created `src/_generated/$VARIANT.js` configuration to the subgraph YAML template.<br/>`[yarn template 1/2] subgraph.template.yaml → subgraph.yaml`

4. Mustache is used to bind the newly created `src/_generated/#variant#.js` configuration to typescript environment file.<br/>`[yarn template 1/2] src/constants/env.mustache → src/constants/env.ts`

5. Based on the chosen variant, we'll use the $NAME variable to point to the correct subgraph by name and deploy everything.<br/>`[yarn deploy]`

## Preprocessing caveats

We're initially declaring the coniguration variables in `src/constants/addresses`. We need to 
- bind the config to the `yaml` template and
- bind the config to the `src/constants/index.ts` to access it from the entire project at runtime. 

Because a) mustache can only handle `js` files as **source** and b) assembly script cannot use dotenv, we're implementing this special pre-processing flow to make up for it. Some issues and decisions:

- The `src/_generated` folder is not replaceable by a single `ts` file because mustache is not able to read `ts`. It can only handle `js` files as **source**.
- The `src/_generated` folder is not replaceable by a single `js` file because the `--outFile` flag is not usable with `tsc` when the `--module` flag is CommonJS. We need this so mustache can read the exports.
- AssemblyScript doesn't allow for `js` or `json` files to be imported directly into `ts`


## Deployment procedure
0. `yarn run codegen` (if there were changes to the schema.graphql)
1. `yarn deploy:kovan-dev --access-token XXXXXXX` (the $VARIANT here is kovan-dev | for the access token, see the dashboard for the pods account) 