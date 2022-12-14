import { TreeNode } from "./TreeNode";
import { HierarchyPointNode, HierarchyPointLink } from 'd3-hierarchy';
import {
    Edge,
    Node,
    Position,
} from 'react-flow-renderer';
import { Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { MarkerType } from 'react-flow-renderer';


const newNode = (nodeData: HierarchyPointNode<TreeNode<any>>, incoming: boolean) => {

    //TODO: add balance and transaction history details for tooltip
    // const data = nodeData.data.data.data;

    const addrSubstring: string = `${nodeData.data.id.substring(0, 8)}...${nodeData.data.id.substring(
        nodeData.data.id.length - 8,
        nodeData.data.id.length
    )}`;

    const labelContent: JSX.Element = (
        <div>
            <Tooltip
                overlay={<div className="underline text-sm">{nodeData.data.id}</div>} color={'#404040'}>
                <div>
                    {nodeData.data.data.annotation !== undefined && nodeData.data.data.annotation.length > 0
                        ? nodeData.data.data.annotation
                        : addrSubstring}{' '}
                </div>
            </Tooltip>
            <Tooltip title={'Double click a node to retrieve more transactions.'} color={'#404040'}>
                <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
            </Tooltip>{' '}
        </div>
    );

    const nodeStyle: any = {
        width: 400,
        fontWeight: '300',
        fontSize: '20px',
        color: '#333',
        border: '2px solid #18181b',
        borderRadius: '10px'
    }

    return {
        id: nodeData.data.id as string,
        data: {
            label: labelContent,
            depth: nodeData.depth,
            annotation: nodeData.data.data.annotation

        },
        position: { x: (incoming ? -1 : 1) * nodeData.y, y: nodeData.x },
        style: nodeStyle,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    }
}

const newEdge = (edgeData: HierarchyPointLink<TreeNode<any>>, incoming: boolean) => {

    const recipient = edgeData.target.data.id;
    const sender = edgeData.source.data.id;
    const edgeSourceAddress = incoming ? recipient : sender;
    const edgeTargetAddress = incoming ? sender : recipient;
    const data = edgeData.target.data.data.data;
    const transactionHash = data.transaction.hash;
    const currencyAmount = data.amount.toPrecision(5) ?? '';
    const currencySymbol = data?.currency?.symbol ?? 'BTC'; //TODO: Handle this properly, as multiple edge cases could now result with incorrect BTC tag

    const labelStyle = {
        fontSize: '20px'
    }

    const arrowStyle = {
        stroke: incoming ? '#45f542' : '#ba1111',
        strokeWidth: 5,
    }

    return (
        {
            id: `${transactionHash}-${edgeSourceAddress}->${edgeTargetAddress}`,
            source: edgeSourceAddress,
            target: edgeTargetAddress,
            data: {
                txHash: transactionHash,
                sender: edgeSourceAddress,
                recipient: edgeTargetAddress,
                currency: currencySymbol,
                amount: data.amount,
            },
            label: `${currencyAmount
                } ${currencySymbol}`,
            labelStyle: labelStyle,
            style: arrowStyle,
            markerEnd: { type: MarkerType.ArrowClosed },
        }
    )
}

/*
Given d-3 descendants and links, we need to convert this data to fit our react-flow graph

@param nodesIncoming incoming transactions, d3-hierarchy nodes to build our data tree for rendering
@param nodesOutgoing outgoing transactions, d3-hierarchy nodes to build our data tree for rendering
*/
export const getReactFlowNodesAndEdges = (
    nodesIncoming: HierarchyPointNode<TreeNode<any>>,
    nodesOutgoing: HierarchyPointNode<TreeNode<any>>
) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const seen: Map<string, any> = new Map();

    [nodesIncoming, nodesOutgoing].forEach((value, index) => {
        const incoming: boolean = index === 0;

        for (const address of value.descendants()) {
            if (seen.get(address.data.id) !== undefined) continue;
            nodes.push(newNode(address, incoming));
            seen.set(address.data.id, '');
        }

        value.links().forEach((transaction) => {
            edges.push(newEdge(transaction, incoming));
        }
        );
    });

    return { nodes, edges };
}