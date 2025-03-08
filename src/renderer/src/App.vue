<template>
  <el-container class="leveldb-manager">
    <el-aside width="350px" class="left-panel">
      <el-button type="primary" class="new-connect-btn" @click="showConnectionDialog = true">
        + New Connect
      </el-button>

      <div class="connections-list">
        <el-tree :data="mergedTreeData" :props="treeProps" :expand-on-click-node="false" node-key="id"
          @node-click="handleNodeClick" @node-contextmenu="handleContextMenu">
          <template #default="{ node }">
            <span class="custom-node" :class="{ 'connection-root-node': node.data.type === 'connection-root' }">
              <span v-if="node.data.type === 'connection-root'">
                📁 {{ node.data.name }}
              </span>
              <span v-else>
                {{ node.data.name }}
              </span>
            </span>
          </template>
        </el-tree>
      </div>
    </el-aside>

    <el-main class="right-panel">
      <div class="value-viewer">
        <vue-json-pretty v-if="selectedValue" :data="selectedValue" :deep="3" class="json-viewer" />
        <div v-else class="placeholder">Select a key to view its value</div>
      </div>
    </el-main>

    <!-- 右键菜单 -->
    <ul v-if="contextMenu.visible" class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }">
      <li @click="deleteKey(contextMenu.fullKey)">Delete Key ({{ contextMenu.fullKey }})</li>
    </ul>

    <!-- 新建连接对话框 -->
    <el-dialog title="New Connection" v-model="showConnectionDialog" width="30%">
      <el-button @click="selectFolder">Select Database Folder</el-button>
      <p class="selected-path">{{ newConnectionPath || 'No folder selected' }}</p>
      <template #footer>
        <el-button @click="showConnectionDialog = false">Cancel</el-button>
        <el-button type="primary" @click="addConnection" :disabled="!newConnectionPath">Connect</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script>
import { ref, nextTick, computed } from 'vue';
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

export default {
  components: { VueJsonPretty },
  setup() {
    const connections = ref([]);
    const selectedValue = ref(null);
    const showConnectionDialog = ref(false);
    const newConnectionPath = ref('');
    const contextMenu = ref({
      visible: false,
      x: 0,
      y: 0,
      fullKey: '',
      path: null,
    });

    const treeProps = ref({
      label: 'name',
      children: 'children',
    });
    // 合并所有连接的树形数据
    const mergedTreeData = computed(() => {
      return connections.value.map(conn => ({
        id: `root-${conn.path}`,
        name: conn.path,
        children: formatTreeData(conn.tree, conn.path),
        isLeaf: false,
        path: conn.path,
        type: 'connection-root'
      }));
    });
    const selectFolder = async () => {
      const path = await ipcRenderer.invoke("open-folder-dialog");
      newConnectionPath.value = path;
    };

    const addConnection = async () => {
      try {
        await ipcRenderer.invoke("open-db", newConnectionPath.value);
        const tree = await ipcRenderer.invoke("parse-db", newConnectionPath.value);
        connections.value.push({ path: newConnectionPath.value, tree });
        showConnectionDialog.value = false;
        newConnectionPath.value = "";
      } catch (error) {
        console.error(`Connection failed: ${error.message}`);
      }
    };

    const formatTreeData = (node, path) => {
      let counter = 0;
      const formatNode = (obj, parentPath = path) => {
        return Object.entries(obj).map(([key, value]) => {
          const uniqueId = `${parentPath}-${++counter}`;
          return {
            id: uniqueId,
            name: key,
            children: typeof value === 'object' ? formatNode(value, uniqueId) : [],
            isLeaf: typeof value !== 'object',
            rawValue: value,
            path: parentPath,
            parent: null // 在格式化时存储父级
          };
        });
      };
      return formatNode(node);
    };

    // 获取完整的 Key 路径 (格式为 "!sub1!!sub2!key")
    const getFullKeyPath = (node) => {
      let keys = [];
      while (node) {
        keys.unshift(`!${node.name}`);
        node = node.parent;
      }
      return keys.join('!');
    };

    // 右键菜单
    const handleContextMenu = (event, data) => {
      event.preventDefault();
      contextMenu.value = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        fullKey: getFullKeyPath(data),
        path: data.path
      };

      document.addEventListener('click', closeContextMenu);
    };

    // 关闭右键菜单
    const closeContextMenu = () => {
      contextMenu.value.visible = false;
      document.removeEventListener('click', closeContextMenu);
    };

    // 删除 Key
    const deleteKey = async (fullKey) => {
      if (!fullKey) return;
      // 根据 `!` 分割路径，找到要删除的 Key
      const keys = fullKey.split('!!').map(k => k.replace(/^!/, ''));
      const connection = connections.value.find(conn => conn.path === contextMenu.value.path);
      if (!connection) return;

      let current = connection.tree;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
        if (!current) return;
      }

      // 删除最后一个 Key
      delete current[keys[keys.length - 1]];

      // 触发刷新
      connections.value = [...connections.value];

      // 关闭右键菜单
      closeContextMenu();
    };

    const handleNodeClick = (data, node) => {
      if (node.isLeaf) {
        selectedValue.value = data.rawValue;
      }
    };

    return {
      mergedTreeData,
      connections,
      selectedValue,
      showConnectionDialog,
      newConnectionPath,
      treeProps,
      selectFolder,
      addConnection,
      formatTreeData,
      handleNodeClick,
      handleContextMenu,
      deleteKey,
      contextMenu,
    };
  },
};
</script>

<style scoped>
.leveldb-manager {
  width: 100%;
  height: 100%;
  display: flex;
}

.left-panel {
  padding: 20px;
  border-right: 1px solid #ebeef5;
  background: white;
}

.right-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: white;
}

.new-connect-btn {
  width: 100%;
  margin-bottom: 20px;
}

.connections-list {
  height: calc(100vh - 100px);
  overflow-y: auto;
}

.connection-tree {
  margin-bottom: 10px;
}

.value-viewer {
  width: 100%;
  min-height: 100%;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  overflow-y: auto;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  list-style: none;
  padding: 5px 0;
  z-index: 1000;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
}

.context-menu li {
  padding: 8px 15px;
  cursor: pointer;
}

.context-menu li:hover {
  background: #f5f5f5;
}
</style>
