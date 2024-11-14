import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { nodes, edges } from './js/output_data';

const NetworkGraph = () => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 800;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-100)) // -300에서 -100으로 감소
      .force('center', d3.forceCenter(width / 2, height / 2)) // 중앙 정렬
      .force('x', d3.forceX(width / 2).strength(0.1)) // X 축으로 중앙으로 당기는 힘 추가
      .force('y', d3.forceY(height / 2).strength(0.1)); // Y 축으로 중앙으로 당기는 힘 추가

    svg.append('g')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', '#aaa');

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#69b3a2')
      .call(drag(simulation));

    node.append('title').text(d => d.id);

    simulation.on('tick', () => {
      svg.selectAll('line')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      svg.selectAll('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

    function drag(simulation) {
      return d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });
    }
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default NetworkGraph;
