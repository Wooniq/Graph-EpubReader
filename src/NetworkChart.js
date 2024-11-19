import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';

const NetworkChart = ({ data }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data || !data.edges || !data.nodes) {
      console.error("Invalid data format: Ensure 'nodes' and 'edges' are properly defined.");
      return;
    }

    // SVG 너비와 높이 설정
    const width = 928;
    const height = 600;

    // 색상 스케일 설정
    const color = d3.scaleOrdinal(["#f7ad63", "#6ade53", "#f15fb2", "#83d7f1", "#a133ff"]); // 주황색, 녹색, 핑크색, 하늘색, 보라색

    // 링크와 노드 데이터를 복사
    const edges = data.edges.map(d => ({ ...d }));
    const nodes = data.nodes.map(d => ({ ...d }));

    // 노드 크기: 데이터 기반 크기 범위 제한
    const sizeScale = d3.scaleLinear()
      .domain([0, d3.max(nodes, d => d.degree)]) // degree 값의 범위
      .range([15, 30]); // 최소 15, 최대 30 크기

    // 시뮬레이션 설정
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(edges).id(d => d.id).distance(150).strength(0.2)) // 약한 링크 장력
      .force("charge", d3.forceManyBody()
        .strength(-50) // 부드러운 반발력 감소
        .distanceMin(20) // 최소 거리 증가
        .distanceMax(500) // 최대 거리 증가
      )
      .force("center", d3.forceCenter(width / 2, height / 2)) // 중심 위치 유지
      .force("collision", d3.forceCollide().radius(d => sizeScale(d.degree) + 10)) // 충돌 반경 증가
      .force("x", d3.forceX(width / 2).strength(0.05)) // 중심 복귀 강도 증가
      .force("y", d3.forceY(height / 2).strength(0.05)) // 중심 복귀 강도 증가
      .alphaDecay(0.03) // 수렴 속도 약간 증가
      .alphaTarget(0.02) // 이동 강도 약간 증가
      .on("tick", ticked);

    // SVG 요소 선택 및 속성 설정
    const svg = d3.select(chartRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("max-width", "100%")
      .style("height", "auto");
    svg.selectAll("*").remove();

    // 링크 요소 추가
    const edge = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));

    // 툴팁 생성
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "#fff")
      .style("padding", "8px")
      .style("border-radius", "5px")
      .style("font-size", "12px");

    // 노드 그룹 생성 (노드와 텍스트를 함께 포함)
    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .on("mouseover", (event, d) => { // 마우스 오버 시 툴팁 표시
        tooltip.style("visibility", "visible")
          .text(`ID: ${d.id}\nDescription: ${d.description || "N/A"}`);
      })
      .on("mousemove", (event) => { // 툴팁 위치 업데이트
        tooltip.style("top", `${event.pageY + 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => { // 마우스 아웃 시 툴팁 숨김
        tooltip.style("visibility", "hidden");
      })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // 노드 원(circle)과 텍스트 추가
    nodeGroup.append("circle")
      .attr("r", d => sizeScale(d.degree)) // degree를 기준으로 크기 설정
      .attr("fill", d => color(d.type)) // 노드 색상 설정
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    nodeGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "10px")
      .style("font-weight", "bold") // 텍스트를 볼드체로 설정
      .style("fill", "#333")
      .text(d => d.id);

    // tick 이벤트에서 요소 위치 업데이트
    function ticked() {
      edge
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      nodeGroup
        .attr("transform", d => `translate(${d.x},${d.y})`); // 노드와 텍스트를 함께 이동
    }

    // 드래그 시작 이벤트 핸들러
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    // 드래그 중 이벤트 핸들러
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    // 드래그 종료 이벤트 핸들러
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data]);

  return <svg ref={chartRef}></svg>;
};

export default NetworkChart;
