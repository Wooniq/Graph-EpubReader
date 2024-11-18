import neo4j from 'neo4j-driver';
import { neo4jConfig } from './config';

// Neo4j 데이터베이스 연결 설정
const driver = neo4j.driver(
  neo4jConfig.uri, 
  neo4j.auth.basic(neo4jConfig.username, neo4jConfig.password)
);

// Neo4j에 쿼리를 실행하고 데이터를 가져오는 비동기 함수
export async function fetchData() {
  const session = driver.session();
  
  try {
    //console.log('Neo4j 데이터베이스에 쿼리 실행 중...');

    // 양방향 관계를 모두 포함하여 쿼리 실행
    const result = await session.run(`
      MATCH (n)-[r]->(m) RETURN n, r, m
      UNION
      MATCH (n)<-[r]-(m) RETURN n, r, m
    `);
    
    //console.log('쿼리 결과:', result);

    /*
     * result.records: 쿼리 결과
     * 각 record는 노드(n, m)와 관계(r) 포함 
     */
    const nodes = [];
    const links = [];

    result.records.forEach(record => {
      const nNode = record.get('n');
      const mNode = record.get('m');
      
      // 노드가 존재하는지 확인
      if (!nNode || !mNode) {
        console.error('노드 정보가 없습니다.');
        return;
      }
      
      /*
      * 각 노드에서 name 또는 value 속성을 가져옴
      * 속성이 없을 경우 노드의 고유 식별자(identity)를 사용해 기본 이름으로 지정
      */
      const nId = nNode.properties.id || nNode.properties.human_readable_id || `Node_${nNode.identity}`;
      const mId = mNode.properties.id || mNode.properties.human_readable_id || `Node_${mNode.identity}`;

      const nProperties = nNode.properties || {};
      const mProperties = mNode.properties || {};

      // 중복된 노드 방지하며 노드 추가
      if (!nodes.some(node => node.id === nId)) {
        nodes.push({ name: nId, ...nProperties });
      }
      if (!nodes.some(node => node.name === mId)) {
        nodes.push({ name: mId, ...mProperties });
      }

      // 각 노드간 관계 정보를 links 배열에 추가
      links.push({
        source: nId,
        target: mId,
        relationship: record.get('r').type
      });

      //console.log('생성된 링크:', { source: nId, target: mId, relationship: record.get('r').type });
    });

    //console.log('최종 노드:', nodes);
    //console.log('최종 링크:', links);

    return { nodes, links };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { nodes: [], links: [] };
  } finally {
    await session.close();
    //console.log('Neo4j 세션 닫힘');
  }
}