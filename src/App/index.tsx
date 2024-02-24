import ReactFlow, { Node, ConnectionLineType, Controls, NodeOrigin, OnConnectEnd, OnConnectStart, Panel, useReactFlow, useStoreApi } from 'reactflow';
 
// we have to import the React Flow styles for it to work
import 'reactflow/dist/style.css';
import  useStore, { RFState } from './store';
import { shallow } from 'zustand/shallow';
import MindMapNode from './MindMapNode';
import MindMapEdge from './MindMapEdge';
import { useCallback, useRef } from 'react';

const nodeTypes = {
  mindmap: MindMapNode,
};
 
const edgeTypes = {
  mindmap: MindMapEdge,
};

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  addChildNode: state.addChildNode,
});

const nodeOrigin: NodeOrigin = [0.5, 0.5];
const connectionLineStyle = { stroke: '#F6AD55', strokeWidth: 3 };
const defaultEdgeOptions = { style: connectionLineStyle, type: 'mindmap' };

function Flow() {

  const { nodes, edges, onNodesChange, onEdgesChange, addChildNode } = useStore(
    selector,
    shallow,
  );
  const connectingNodeId = useRef<string | null>(null);
  const store = useStoreApi();
  const { screenToFlowPosition } = useReactFlow();

  const getChildNodePosition = (
    event: MouseEvent | TouchEvent,
    parentNode?: Node,
  ) => {
    const { domNode } = store.getState();

    if (
      !domNode ||
      !parentNode?.positionAbsolute ||
      !parentNode?.width ||
      !parentNode?.height
    ) {
      return;
    }

    const isTouchEvent = 'touches' in event;
    const x = isTouchEvent ? event.touches[0].clientX : event.clientX;
    const y = isTouchEvent ? event.touches[0].clientY : event.clientY;
    const panePosition = screenToFlowPosition({
      x,
      y,
    });

    return {
      x: panePosition.x - parentNode.positionAbsolute.x + parentNode.width / 2,
      y: panePosition.y - parentNode.positionAbsolute.y + parentNode.height / 2,
    };
  };

  const onConnectStart: OnConnectStart = useCallback((_, { nodeId }) => {
    connectingNodeId.current = nodeId;
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const { nodeInternals } = store.getState();
      const targetIsPane = (event.target as Element).classList.contains(
        'react-flow__pane',
      );

      if (targetIsPane && connectingNodeId.current) {
        const parentNode = nodeInternals.get(connectingNodeId.current);
        const childNodePosition = getChildNodePosition(event, parentNode);

        if (parentNode && childNodePosition) {
          addChildNode(parentNode, childNodePosition);
        }
      }
    },
    [getChildNodePosition],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnectStart={onConnectStart}
      onConnectEnd={onConnectEnd}
      nodeOrigin={nodeOrigin}
      defaultEdgeOptions={defaultEdgeOptions}
      connectionLineStyle={connectionLineStyle}
      connectionLineType={ConnectionLineType.Straight}
      fitView
    >
      <Controls showInteractive={false} />
      <Panel position="top-left">React Flow Mind Map</Panel>
    </ReactFlow>
  );
}
 
export default Flow;