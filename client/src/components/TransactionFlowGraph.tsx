import ReactFlow, { Controls, useEdgesState, useNodesState, Node, useReactFlow } from "react-flow-renderer";
import { LoadingOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
import { client } from "../gql/apolloClient";
import { IQueryParams } from "../pages/TransactionFlow";
import { mapDataToHierarchyLayout } from "../graphUtils/buildGraphLayout";
import { getReactFlowNodesAndEdges } from "../graphUtils/buildNodesAndEdges";
import { TreeNode } from "../graphUtils/TreeNode";
import { Modal } from "antd";
import { NetworkToQueryMappings } from "../constants/BitqueryNetworksEnum";

interface IGraphInputs {
  address: string,
  search: boolean,
  setSearch: React.Dispatch<React.SetStateAction<boolean>>,
  queryParams: IQueryParams
}

const map: Map<string, TreeNode<any>> = new Map();

const TransactionFlowGraph: React.FC<IGraphInputs> = ({ address, search, setSearch, queryParams }: IGraphInputs): JSX.Element => {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [rootData, setRootData] = useState(
    new TreeNode<any>(
      map,
      {},
      ''
    )
  );

  useEffect(() => {
    if (search) {
      setGraphLayout(address, true);
      setSearch(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const { fitView } = useReactFlow();

  useEffect(() => {
    fitView();
  }, [nodes, fitView]);

  const getTransactionData = async (inputAddress: string) => {
    try {

      const response = await client.query({
        query: NetworkToQueryMappings.get(queryParams.network)!,
        variables: {
          ...queryParams,
          address: inputAddress
        }
      });

      if (response.data.ethereum) {
        return response.data.ethereum;
      }

      if (response.data.bitcoin) {
        return response.data.bitcoin;
      }

      if (!response.data.ethereum && !response.data.bitcoin) {
        setLoading(false);
        throw new Error("No transactions were found for this address. Please adjust your parameters and try again.");
      }

    } catch (e: any) {
      Modal.error({
        title: "Error",
        content: e.message
      })
      setRootData(
        new TreeNode<any>(
          map,
          {},
          ''
        )
      );
      setNodes([]);
      setEdges([]);
      setLoading(false);
      throw new Error();
    }
  }

  const setGraphLayout = async (inputAddress: string, setRoot: boolean = false) => {
    setLoading(true);
    const initialRootData = new TreeNode(map, {}, address);
    setRoot ? setRootData(initialRootData) : setRootData(rootData);

    const transactionFlowData = await getTransactionData(inputAddress);
    const { nodesIncoming, nodesOutgoing } = mapDataToHierarchyLayout(inputAddress, transactionFlowData, setRoot, initialRootData, rootData, map, queryParams.network);

    const initialElements = getReactFlowNodesAndEdges(nodesIncoming, nodesOutgoing);
    setNodes(initialElements.nodes);
    setEdges(initialElements.edges);
    setLoading(false);
  }

  return (
    <div className="relative grid grid-cols-4 h-[700px] w-full bg-gray-100 border border-b-0 border-zinc-900">
      <div className="col-span-4 w-full h-full border border-t-0 border-l-0 border-r-0 border-zinc-900">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeDoubleClick={(_, node: Node) => setGraphLayout(node.id, false)}
          minZoom={-Infinity}
          zoomOnScroll={true}
          style={{ background: '#f4f4f4' }}
          fitView={true}
          proOptions={{ account: 'paid-pro', hideAttribution: true }}
        >
          <Controls />
        </ReactFlow>
      </div>
      {loading ? (
        <div className="z-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <LoadingOutlined style={{ fontSize: 200 }} spin />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default TransactionFlowGraph;