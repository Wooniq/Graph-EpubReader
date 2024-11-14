import os
import xml.etree.ElementTree as ET

def find_graphml_file(base_path):
    # output 디렉터리에서 타임스탬프 형식의 하위 폴더를 탐색
    for timestamp_folder in os.listdir(base_path):
        timestamp_path = os.path.join(base_path, timestamp_folder)
        if os.path.isdir(timestamp_path):
            artifacts_path = os.path.join(timestamp_path, "artifacts")
            graphml_file = os.path.join(artifacts_path, "clustered_graph.graphml")
            if os.path.exists(graphml_file):
                return graphml_file
    return None

def parse_graphml(graphml_path, output_js_path):
    # XML 파일 파싱
    tree = ET.parse(graphml_path)
    root = tree.getroot()

    # namespace 정의 (GraphML 파일의 경우에 필요)
    ns = {'graphml': 'http://graphml.graphdrawing.org/xmlns'}

    # 노드와 엣지 데이터 수집
    nodes = []
    edges = []

    for graph in root.findall('graphml:graph', ns):
        for node in graph.findall('graphml:node', ns):
            node_id = node.get('id')
            properties = {data.get('key'): data.text if data.text is not None else 'null' for data in node.findall('graphml:data', ns)}
            nodes.append({'id': node_id, **properties})

        for edge in graph.findall('graphml:edge', ns):
            source = edge.get('source')
            target = edge.get('target')
            properties = {data.get('key'): data.text if data.text is not None else 'null' for data in edge.findall('graphml:data', ns)}
            edges.append({'source': source, 'target': target, **properties})

    # JavaScript 파일로 결과 저장
    with open(output_js_path, 'w') as js_file:
        js_file.write('const nodes = ')
        js_file.write(str(nodes).replace('None', 'null'))
        js_file.write(';\n')
        js_file.write('const edges = ')
        js_file.write(str(edges).replace('None', 'null'))
        js_file.write(';\n')
        js_file.write('export { nodes, edges };')

# 파일 경로 지정 및 함수 호출
base_path = './parquet/output'  # output 디렉터리 경로
graphml_path = find_graphml_file(base_path)

if graphml_path:
    parse_graphml(graphml_path, './js/output_data.js')
    print(f"{graphml_path} 파일을 성공적으로 변환했습니다.")
else:
    print("clustered_graph.graphml 파일을 찾을 수 없습니다.")
