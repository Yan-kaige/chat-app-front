<template>
  <el-container>
    <!-- Header -->
    <el-header>
      <el-button type="text" icon="el-icon-arrow-left" @click="goBackToList" class="back-button">
        返回聊天室列表 </el-button>

      <h2>聊天室: {{ chatRoomName }}</h2>


    </el-header>

    <!-- Main Content -->
    <el-main>
      <!-- Chat Messages -->
      <el-card class="chat-messages" shadow="hover" v ref="messagesContainer">
        <div v-for="message in messages" :key="message.id"
          :class="['message', message.username == currentUser.username ? 'message-right' : 'message-left']">
          <div class="message-time"><strong>{{ message.username }}:</strong>{{ message.createdAt }}</div>
          <div class="message-content">

            <p>{{ message.text }}</p>
          </div>
        </div>
      </el-card>

      <div class="action-buttons">
        <el-button type="primary" @click="openFileList">查看文件列表</el-button>
        <el-button type="success" @click="openFileUpload">上传文件</el-button>
        <el-button type="primary" @click="toggleDrawer">在线用户</el-button>
        <el-button type="primary" @click="openInviteDialog" >邀请用户</el-button>
      </div>

      <!-- Message Input -->
      <el-form @submit.prevent="sendMessage" inline class="message-form">
        <el-input v-model="newMessage" placeholder="输入消息......" class="message-input" clearable />
        <el-button type="primary" @click="sendMessage">发送</el-button>
      </el-form>
    </el-main>

    <!-- Drawer for Online Users -->
    <el-drawer title="在线用户" v-model="drawerVisible" direction="rtl" size="300px">

      <el-table :data="onlineUsers" style="width: 100%">
        <el-table-column prop="username" label="名称"></el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button type="primary" @click="startPrivateChat(scope.row)"
              v-if="scope.row.username != currentUser.username">私聊</el-button>
          </template>
        </el-table-column>

      </el-table>
    </el-drawer>



    <el-dialog v-model="privateDialogVisible" :title="perTitle" width="500">

      <el-card class="chat-messages-p" shadow="hover" v ref="priMessagesContainer">
        <div v-for="message in priMessages" :key="message.id"
          :class="['message', message.username == currentUser.username ? 'message-right' : 'message-left']">
          <div class="message-time"><strong>{{ message.username }}:</strong>{{ message.createdAt }}</div>
          <div class="message-content">

            <p>{{ message.text }}</p>
          </div>
        </div>
      </el-card>

      <el-form @submit.prevent="sendPriMessage" inline class="message-form">
        <el-input v-model="priNewMessage" placeholder="输入消息......" class="message-input" clearable />
        <el-button type="primary" @click="sendPriMessage">发送</el-button>
      </el-form>
    </el-dialog>




    <!-- File List Drawer -->
    <el-drawer  title="文件列表" v-model="fileListDrawerVisible" direction="rtl" size="500px">
      <el-table :data="fileList" style="width: 100%">
        <el-table-column prop="fileRealName" label="文件名"></el-table-column>
        <el-table-column prop="fileSize" label="大小 (KB)"></el-table-column>
        <el-table-column prop="userId" label="上传者"></el-table-column>
        <el-table-column>
          <template #default="scope">
            <el-button type="text" size="mini"  @click="downloadFile(scope.row)">下载</el-button>
            <el-button type="text" size="mini" @click="deleteFile(scope.row)">删除</el-button>

          </template>
        </el-table-column>
      </el-table>
    </el-drawer>

    <!-- File Upload Dialog -->
    <el-dialog title="上传文件" v-model="fileUploadDialogVisible">
      <el-upload class="upload-demo" drag :action="`/api/file/upload/${roomId}`" :on-success="handleUploadSuccess">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">拖拽文件到这里，或 <em>点击上传</em></div>
        <div class="el-upload__tip">支持单个文件上传</div>
      </el-upload>
      <template #footer>
        <el-button @click="fileUploadDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>



    <el-dialog title="邀请用户" v-model="inviteDialogVisible" width="500px">
      <el-form>
        <el-form-item label="选择用户">
          <el-select v-model="selectedUsers" multiple placeholder="选择需要邀请的用户" style="width: 100%;">
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelInvite()">取消</el-button>
        <el-button type="primary" @click="sendInvitations">确认邀请</el-button>
      </span>
    </el-dialog>
  </el-container>
</template>

<script>
import axios from "axios";
import { Client } from "@stomp/stompjs";


export default {
  data() {
    return {
      roomId: this.$route.params.roomId,
      chatRoomName: "",
      messages: [],
      newMessage: "",
      stompClient: null, // 保存 STOMP 客户端实例
      currentUser: null,
      drawerVisible: false, // 控制抽屉的显示/隐藏
      onlineUsers: [], // 在线用户列表
      privateDialogVisible: false,  //私聊对话框
      perTitle: "私聊",
      priMessages: [], //私聊消息
      priNewMessage: "", //私聊新消息
      receiverId: 0,
      fileListDrawerVisible: false,  // 文件列表抽屉
      fileUploadDialogVisible: false, // 文件上传对话框
      fileList: [], // 文件列表
      inviteDialogVisible: false, // 弹框可见性
      availableUsers: [], // 可邀请的用户列表
      selectedUsers: [], // 被选中的用户ID列表

    };
  },
  async mounted() {
    const roomId = this.$route.params.roomId;

    this.currentUser = {
      username: localStorage.getItem("chat_cur_user_name"),
      userId: localStorage.getItem("chat_cur_user_id")
    }
    console.log("11" + this.currentUser.username);

    try {
      await axios.post(`/api/chatroom/${roomId}/join`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    } catch (error) {
      console.error("Failed to join the chat room:", error);
    }

    await this.fetchOnlineUsers(roomId);

        // 初始化加载可用用户
        await this.fetchAvailableUsers();


    // 获取聊天室数据
    await this.fetchChatRoomData(roomId);
    this.stompClient = new Client({
      brokerURL: "ws://localhost:8765/ws", // 你的 WebSocket URL
      debug: (str) => console.log(str), // 调试日志
      reconnectDelay: 5000, // 自动重连时间
    });

    // 激活客户端
    this.stompClient.onConnect = () => {
      console.log("Connected to WebSocket");

      // 订阅特定聊天室
      this.stompClient.subscribe(`/topic/chatroom/${roomId}`, (message) => {
        this.fetchChatRoomData(roomId); // 刷新数据
        this.scrollToBottom(); // 数据加载后滚动到底部
      });
    };

    // 激活 STOMP 客户端
    this.stompClient.activate();
  },
  methods: {
    // Fetch chat room data
    async fetchChatRoomData(roomId) {
      try {
        const chatRes = await axios.get(`/api/chatroom/${roomId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (chatRes.data) {
          this.chatRoomName = chatRes.data.name;
        }

        const roomRes = await axios.get(`/api/chatroomMsg/${roomId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });


        // response.data如果不为空
        this.messages = [];

        if (roomRes.data) {
          //循环遍历
          for (let i = 0; i < roomRes.data.length; i++) {
            this.messages.push({
              id: roomRes.data[i].messageId,
              username: roomRes.data[i].user.username,
              text: roomRes.data[i].messageText,
              createdAt: roomRes.data[i].createdAt
            });
          }
        }

        this.scrollToBottom(); // 数据加载后滚动到底部

      } catch (error) {
        console.error("Failed to load chat room data:", error);
      }
    },
    async fetchSingleChatRoomData(roomId, receiverId) {
      try {

        const roomRes = await axios.get(`/api/privateMsg/${roomId}/${receiverId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });


        // response.data如果不为空
        this.priMessages = [];

        if (roomRes.data) {
          //循环遍历
          for (let i = 0; i < roomRes.data.length; i++) {
            this.priMessages.push({
              id: roomRes.data[i].id,
              username: roomRes.data[i].sender.username,
              text: roomRes.data[i].messageText,
              createdAt: roomRes.data[i].createdAt
            });
          }
        }

        this.scrollToBottom(); // 数据加载后滚动到底部

      } catch (error) {
        console.error("Failed to load chat room data:", error);
      }
    },
    async fetchOnlineUsers(roomId) {
      try {
        const response = await axios.get(`/api/chatroom/${roomId}/online`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (response.data) {
          response.data.forEach((item) => {
            this.onlineUsers.push({
              username: item.user.username,
              userId: item.user.id
            });
          });

        }
      } catch (error) {
        console.error("Failed to fetch online users:", error);
      }
    },
    // Send message
    async sendMessage() {
      //判断消息不能为空
      if (!this.newMessage) {
        this.$message.error("消息不能为空");
        return;
      }
      const roomId = this.$route.params.roomId;
      try {
        await axios.post(
          `/api/chatroom/${roomId}/messages`,
          { messageText: this.newMessage },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        this.newMessage = "";
        await this.fetchChatRoomData(roomId); // 刷新数据


      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    async sendPriMessage() {
      //判断消息不能为空
      if (!this.priNewMessage) {
        this.$message.error("消息不能为空");
        return;
      }
      const roomId = this.$route.params.roomId;
      try {
        await axios.post(
          `/api/privateMsg/send/${roomId}/${this.receiverId}`,
          { messageText: this.priNewMessage },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        this.priNewMessage = "";
        await this.fetchSingleChatRoomData(roomId, this.receiverId); // 刷新数据


      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    // Go back to the chat room list
    goBackToList() {
      const roomId = this.$route.params.roomId;
      axios.delete(
        `/api/chatroom/${roomId}/exit`,
        { roomId: roomId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      this.$router.push("/chatroomList");
    },
    scrollToBottom() {
      const container1 = this.$refs.messagesContainer?.$el || this.$refs.messagesContainer;
      if (container1) {
        container1.scrollTop = container1.scrollHeight;
      }

      const container2 = this.$refs.priMessagesContainer?.$el || this.$refs.priMessagesContainer;
      if (container2) {
        container2.scrollTop = container2.scrollHeight;
      }
    },
    // 切换 Drawer 显示/隐藏
    toggleDrawer() {
      this.drawerVisible = !this.drawerVisible;
    },
    startPrivateChat(row) {
      this.receiverId = row.userId;
      this.privateDialogVisible = true;
      this.perTitle = "与" + row.username + "私聊";

      this.fetchSingleChatRoomData(this.roomId, row.userId);
      var key = this.generateUniqueChannelIdentifier(this.roomId, this.currentUser.userId, row.userId);
      console.log("订阅了key:" + key);
      this.stompClient.subscribe(`/single/${key}`, (message) => {
        this.fetchSingleChatRoomData(this.roomId, row.userId); // 刷新数据
        this.scrollToBottom(); // 数据加载后滚动到底部
      });
    },
    generateUniqueChannelIdentifier(chatRoomId, senderId, receiverId) {
      if (!senderId || !receiverId) {
        throw new Error("Sender ID and Receiver ID cannot be null or undefined");
      }
      // 按升序排列，保证顺序不变
      const smallerId = Math.min(senderId, receiverId);
      const largerId = Math.max(senderId, receiverId);
      return `chatroom-${chatRoomId}-${smallerId}-${largerId}`;
    },
    // 打开文件列表
    async openFileList() {
      this.fileListDrawerVisible = true;
      try {
        const response = await axios.get(`/api/file/files/${this.roomId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        this.fileList = response.data;
      } catch (error) {
        console.error("Failed to fetch file list:", error);
      }
    },
    // 打开上传文件弹窗
    openFileUpload() {
      this.fileUploadDialogVisible = true;
    },
    // 文件上传成功回调
    handleUploadSuccess(response) {
      this.$message.success("文件上传成功！");
      this.fileUploadDialogVisible = false;
    },
    // 下载文件
    async downloadFile(file) {
      try {
        const response = await axios.get(`/api/file/download/${file.fileId}`, {
          responseType: "blob", // 确保返回二进制数据
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        // 提取后端设置的文件名
        const contentDisposition = response.headers["content-disposition"];
        let fileName = file.fileRealName;

        // 创建一个 URL 对象用于下载文件
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName); // 指定文件名
        document.body.appendChild(link);
        link.click(); // 自动触发下载
        document.body.removeChild(link); // 移除元素
        window.URL.revokeObjectURL(url); // 释放 URL 对象
      } catch (error) {
        console.error("Failed to download file:", error);
      }
    },
    async deleteFile(file) {
      try {
        //提醒
        this.$confirm("确定删除该文件吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }).then(async () => {
          await axios.delete(`/api/file/delete/${file.fileId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          this.$message.success("文件已成功删除！");
          // 更新文件列表
          this.fileList = this.fileList.filter((item) => item.fileId !== file.fileId);
        });


      } catch (error) {
        console.error("Failed to delete file:", error);
        this.$message.error("删除文件失败！");
      }
    },
     // 打开邀请用户弹框
     openInviteDialog() {
      this.inviteDialogVisible = true;
    },
    // 获取可邀请的用户列表
    async fetchAvailableUsers() {
      const roomId = this.$route.params.roomId;
      try {
        const response = await axios.get(`/api/chatroom/${roomId}/invite-list`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        this.availableUsers = response.data;
      } catch (error) {
        console.error("Failed to fetch available users:", error);
      }
    },
    // 发送邀请消息
    async sendInvitations() {
      //邀请用户不能为空
      if (this.selectedUsers.length === 0) {
        this.$message.error("请选择需要邀请的用户");
        return;
      }

      const roomId = this.$route.params.roomId;
      try {
        await axios.post(
          `/api/chatroom/${roomId}/invite`,
          this.selectedUsers ,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        this.$message.success("邀请发送成功！");
        this.inviteDialogVisible = false;
        this.selectedUsers = [];
      } catch (error) {
        console.error("Failed to send invitations:", error);
        this.$message.error("邀请发送失败！");
      }
    },
    cancelInvite() {
      this.inviteDialogVisible = false;
      this.selectedUsers = [];
    },

  },
};
</script>

<style scoped>
.chat-messages {
  height: 60vh;
  /* 占据视窗高度的 90% */
  overflow-y: scroll;
  padding: 20px;
  margin-top: 20px;
}

.chat-messages-p {
  height: 40vh;
  /* 占据视窗高度的 90% */
  overflow-y: scroll;
  padding: 20px;
  margin-top: 20px;
}



.message-form {
  margin-top: 20px;
  display: flex;
  align-items: center;
}

.message-input {
  flex: 1;
  margin-right: 10px;
}

.back-button {
  margin-right: 20px;
}


.message {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  /* 垂直排列 */
}

.message-time {
  font-size: 12px;
  color: #999;
  /* 时间的颜色变淡一些 */
  margin-bottom: 5px;
  /* 时间与内容之间的间距 */
}

.message-content {
  font-size: 14px;
  color: #333;
  /* 内容的颜色更显眼 */
  padding: 8px 12px;
  border-radius: 10px;
  max-width: 60%;

}


/* 左侧消息 */
.message-left {
  align-items: flex-start;
  /* 对齐到左边 */
}

.message-left .message-content {
  background-color: #f0f0f0;
  /* 左侧消息背景色 */
}

/* 右侧消息 */
.message-right {
  align-items: flex-end;
  /* 对齐到右边 */
}

.message-right .message-content {
  background-color: #cce5ff;
  /* 右侧消息背景色 */
  color: #0056b3;
}

.online-users-btn {
  float: right;
  margin-right: 20px;
}

.action-buttons {
  margin: 10px 0;
  display: flex;
}
</style>