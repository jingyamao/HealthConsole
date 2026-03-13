import { Tool } from "@langchain/core/tools";

/**
 * 工具基类
 * 所有自定义工具都应继承此类
 */
export class BaseTool extends Tool {
  constructor(config = {}) {
    super();
    this.name = config.name || "base_tool";
    this.description = config.description || "基础工具";
    this.tags = config.tags || [];
  }

  /**
   * 工具执行逻辑（子类必须实现）
   * @param {string} input - 用户输入
   * @returns {Promise<string>}
   */
  async _call(input) {
    throw new Error("子类必须实现 _call 方法");
  }
}

/**
 * 工具注册表
 * 用于管理和获取所有可用工具
 */
export class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  /**
   * 注册工具
   * @param {string} name - 工具名称
   * @param {BaseTool} tool - 工具实例
   */
  register(name, tool) {
    this.tools.set(name, tool);
    console.log(`✅ 工具注册成功: ${name}`);
  }

  /**
   * 获取工具
   * @param {string} name - 工具名称
   * @returns {BaseTool|undefined}
   */
  get(name) {
    return this.tools.get(name);
  }

  /**
   * 获取所有工具
   * @returns {BaseTool[]}
   */
  getAll() {
    return Array.from(this.tools.values());
  }

  /**
   * 获取工具描述列表
   * @returns {string}
   */
  getToolDescriptions() {
    return Array.from(this.tools.entries())
      .map(([name, tool]) => `${name}: ${tool.description}`)
      .join("\n");
  }
}

// 创建全局工具注册表实例
export const toolRegistry = new ToolRegistry();
