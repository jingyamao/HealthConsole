import { BaseTool, toolRegistry } from "./base.js";

/**
 * 数据库查询工具
 * 用于查询患者信息、统计数据等
 */
class DatabaseQueryTool extends BaseTool {
  constructor() {
    super({
      name: "database_query",
      description: "用于查询患者信息、统计数据、筛选患者等数据库操作。支持查询患者基本信息、疾病统计等。",
      tags: ["database", "query", "statistics"]
    });
  }

  async _call(input) {
    try {
      console.log("📊 执行数据库查询:", input);

      // TODO: 集成真实的数据库查询逻辑
      // 目前返回模拟数据
      const mockResults = {
        patient_count: 156,
        beijing_patients: 23,
        diabetes_patients: 45,
        hypertension_patients: 67
      };

      return `数据库查询结果：
- 总患者数: ${mockResults.patient_count}
- 北京患者数: ${mockResults.beijing_patients}
- 糖尿病患者数: ${mockResults.diabetes_patients}
- 高血压患者数: ${mockResults.hypertension_patients}

注：此为演示数据，实际使用时需要连接真实数据库。`;

    } catch (error) {
      console.error("❌ 数据库查询失败:", error);
      return `数据库查询失败: ${error.message}`;
    }
  }
}

// 注册工具
const databaseQueryTool = new DatabaseQueryTool();
toolRegistry.register(databaseQueryTool.name, databaseQueryTool);

export { databaseQueryTool };
