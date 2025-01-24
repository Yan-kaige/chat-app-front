<template>
  <el-container>
    <!-- Header -->
    <el-header>
      <el-button type="primary" icon="el-icon-arrow-left" @click="goBackToList" class="back-button">
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

            <template v-if="message.messageType == '1'">
              <p>{{ message.text }}</p>
            </template>
            <template v-if="message.messageType == '2'">
              <!-- <el-image :src="message.mediaUrl" style="max-width: 100%; height: auto;" alt="图片消息" /> -->
              <el-image style="width: 100px; height: 100px" :src="message.mediaUrl"
                :preview-src-list="[message.mediaUrl]" />
            </template>

            <template v-if="message.messageType == '3'">
              <audio :src="message.mediaUrl" controls style="width: 200px; height: 40px;">
              </audio>
            </template>

            <template v-if="message.messageType == '4'">
              <video controls :src="message.mediaUrl" style="width: 300px; height: auto;" />
            </template>

            <template v-if="message.messageType == '5'">
              <el-link :href="message.mediaUrl" download>文件名称：{{ message.text }} 点击下载</el-link>
            </template>

          </div>
        </div>
      </el-card>

      <div class="action-buttons">
        <el-button type="primary" @click="openFileList">查看文件列表</el-button>
        <el-button type="success" @click="openFileUpload">上传文件</el-button>
        <el-button type="primary" @click="toggleDrawer">在线用户</el-button>
        <el-button type="primary" @click="openInviteDialog">邀请用户</el-button>

      </div>

      <!-- Message Input -->
      <el-form @submit.prevent="sendMessage" inline class="message-form">
        <el-input v-model="newMessage" placeholder="输入消息......" class="message-input" clearable />

   
        <el-upload class="upload-demo" :auto-upload="false" ref="upload" :on-change="handleFileChange"
        :http-request="httpIntercept"  @click="currentUploadType = 1">
          <el-button>发送文件</el-button>
        </el-upload>


        <el-button @mousedown="startRecording(1)" @mouseup="stopRecording" @mouseleave="stopRecording"
          :disabled="isRecording === null">
          {{ isRecording ? '松开结束录制' : '语音消息长按' }}
        </el-button>

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



    <el-dialog v-model="privateDialogVisible" :title="perTitle" width="80%">

      <el-card class="chat-messages-p" shadow="hover" v ref="priMessagesContainer">
        <div v-for="message in priMessages" :key="message.id"
          :class="['message', message.username == currentUser.username ? 'message-right' : 'message-left']">
          <div class="message-time"><strong>{{ message.username }}:</strong>{{ message.createdAt }}</div>
          <div class="message-content">
            <template v-if="message.messageType == '1'">
              <p>{{ message.text }}</p>
            </template>
            <template v-if="message.messageType == '2'">
              <el-image style="width: 100px; height: 100px" :src="message.mediaUrl"
                :preview-src-list="[message.mediaUrl]" />
            </template>

            <template v-if="message.messageType == '3'">
              <audio :src="message.mediaUrl" controls style="width: 200px; height: 40px;">
              </audio>
            </template>

            <template v-if="message.messageType == '4'">
              <video controls :src="message.mediaUrl" style="width: 300px; height: auto;" />
            </template>

            <template v-if="message.messageType == '5'">
              <el-link :href="message.mediaUrl" download>文件名称：{{ message.text }} 点击下载</el-link>
            </template>
          </div>
        </div>
      </el-card>

      <el-form @submit.prevent="sendPriMessage" inline class="message-form">

        <el-input v-model="priNewMessage" placeholder="输入消息......" class="message-input" clearable />
        <!-- <el-upload class="upload-demo" :action="`/api/chatroom/sendMediaToPerson/${roomId}/${receiverId}`"
          :auto-upload="true" ref="upload" :on-success="handleSendSuccess">
          <el-button>发送文件</el-button>
        </el-upload> -->

        <el-upload class="upload-demo" :auto-upload="false" ref="upload" :on-change="handleFileChange"
        :http-request="httpIntercept"  @click="currentUploadType = 2">
          <el-button>发送文件</el-button>
        </el-upload>

        <el-button @mousedown="startRecording(2)" @mouseup="stopRecording" @mouseleave="stopRecording"
          :disabled="isRecording === null">
          {{ isRecording ? '松开结束录制' : '语音消息长按' }}
        </el-button>
        <el-button type="primary" @click="sendPriMessage">发送</el-button>
      </el-form>
    </el-dialog>




    <!-- File List Drawer -->
    <el-drawer title="文件列表" v-model="fileListDrawerVisible" direction="rtl" size="600px">
      <el-table :data="fileList" style="width: 100%">
        <el-table-column prop="fileRealName" label="文件名"></el-table-column>
        <el-table-column prop="fileSize" label="大小 (KB)"></el-table-column>
        <el-table-column prop="userId" label="上传者"></el-table-column>
        <el-table-column>
          <template #default="scope">
            <el-button type="primary" size="small" @click="downloadFile(scope.row)">下载</el-button>
            <el-button type="primary" size="small" @click="deleteFile(scope.row)">删除</el-button>

          </template>
        </el-table-column>
      </el-table>
    </el-drawer>

    <!-- File Upload Dialog -->
    <el-dialog title="上传文件" v-model="fileUploadDialogVisible">
      <el-upload class="upload-demo" drag :action="`/api/file/upload/${roomId}`" :on-success="handleUploadSuccess"
        :headers="uploadHeaders">
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
            <el-option v-for="user in availableUsers" :key="user.id" :label="user.username"
              :value="user.id"></el-option>
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
import axios from "../axios";
// import stompService from '../stomp';
import webSocketService from "../netty";
import { ElMessageBox, ElMessage } from 'element-plus'
import { id, th } from "element-plus/es/locales.mjs";
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
      mediaRecorder: null,
      audioChunks: [],
      audioBlob: null,
      isRecording: false,
      stream: null,
      currentUploadType: null, // 用于存储当前的上传类型 (1 或 2)


    };
  },
  computed: {
    uploadHeaders() {
      // 从 localStorage 获取 token
      const token = localStorage.getItem('token');
      return {
        Authorization: `Bearer ${token}`, // 添加 Authorization header
      };
    },
  },
  async mounted() {
    const roomId = this.$route.params.roomId;

    this.currentUser = {
      username: localStorage.getItem("chat_cur_user_name"),
      userId: localStorage.getItem("chat_cur_user_id")
    }

    try {
      await axios.post(`/api/chatroom/${roomId}/join`, null, {

      });
    } catch (error) {
      console.error("Failed to join the chat room:", error);
    }

    await this.fetchOnlineUsers(roomId);

    // 初始化加载可用用户
    await this.fetchAvailableUsers();


    // 获取聊天室数据
    await this.fetchChatRoomData(roomId);


    const token = localStorage.getItem('token');
    webSocketService.sendMessage({ action: 'authenticate', token: `Bearer ${token}` })



    // webSocketService.initialize('ws://127.0.0.1:8081/ws');

    // 订阅当前聊天室
    this.subscribeToRoom(this.roomId);
  },
  methods: {
    subscribeToRoom(roomId) {
      webSocketService.subscribeToRoom(roomId, () => {
        this.fetchChatRoomData(roomId); // 刷新数据
        this.fetchSingleChatRoomData(this.roomId, this.receiverId);
        this.scrollToBottom(); // 滚动到底部
        console.log("收到消息");
      });
    },
    // Fetch chat room data
    async fetchChatRoomData(roomId) {
      try {
        const chatRes = await axios.get(`/api/chatroom/${roomId}`, {

        });

        if (chatRes) {
          this.chatRoomName = chatRes.name;
        }

        const roomRes = await axios.get(`/api/chatroomMsg/${roomId}`, {

        });


        // response.data如果不为空
        this.messages = [];

        if (roomRes) {
          //循环遍历
          for (let i = 0; i < roomRes.length; i++) {
            this.messages.push({
              id: roomRes[i].messageId,
              username: roomRes[i].user.username,
              text: roomRes[i].messageText,
              createdAt: roomRes[i].createdAt,
              mediaUrl: roomRes[i].mediaUrl,
              messageType: roomRes[i].messageType
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

        });


        // response.data如果不为空
        this.priMessages = [];

        if (roomRes) {
          //循环遍历
          for (let i = 0; i < roomRes.length; i++) {
            this.priMessages.push({
              id: roomRes[i].id,
              username: roomRes[i].sender.username,
              text: roomRes[i].messageText,
              createdAt: roomRes[i].createdAt,
              mediaUrl: roomRes[i].mediaUrl,
              messageType: roomRes[i].messageType

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

        });
        this.onlineUsers = [];
        if (response) {
          response.forEach((item) => {
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
      // 判断消息不能为空
      if (!this.newMessage) {
        this.$message.error("消息不能为空");
        return;
      }

      const roomId = this.$route.params.roomId;

      try {
        // 通过 WebSocket 发送消息
        webSocketService.sendMessage({
          action: "message",
          roomId: roomId, // 目标聊天室 ID
          content: this.newMessage, // 消息内容
          timestamp: new Date().toISOString(), // 时间戳，可选
        });

        this.newMessage = ""; // 清空输入框
        this.fetchChatRoomData(roomId); // 刷新数据
        this.scrollToBottom(); // 数据加载后滚动到底部
      } catch (error) {
        console.error("Failed to send message:", error);
        this.$message.error("消息发送失败，请重试！");
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
        // 通过 WebSocket 发送消息
        webSocketService.sendMessage({
          action: "private",
          roomId: roomId, // 目标聊天室 ID
          content: this.priNewMessage, // 消息内容
          receiverId: this.receiverId,
          timestamp: new Date().toISOString(), // 时间戳，可选
        }, this.refreshChatRoomData);




      } catch (error) {
        console.error("Failed to send message:", error);
        this.$message.error("消息发送失败，请重试！");
      }

    },
    refreshChatRoomData() {
      this.priNewMessage = ""; // 清空输入框
      this.fetchSingleChatRoomData(this.$route.params.roomId, this.receiverId); // 刷新数据
      this.scrollToBottom(); // 数据加载后滚动到底部
    },

    // Go back to the chat room list
    goBackToList() {
      const roomId = this.$route.params.roomId;
      axios.delete(
        `/api/chatroom/${roomId}/exit`,
        { roomId: roomId }
      );
      //取消订阅
      webSocketService.unsubscribeFromRoom(roomId);
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
      this.fetchOnlineUsers(this.roomId);
      this.drawerVisible = !this.drawerVisible;
    },
    startPrivateChat(row) {
      this.receiverId = row.userId;
      this.privateDialogVisible = true;
      this.perTitle = "与" + row.username + "私聊";

      this.fetchSingleChatRoomData(this.roomId, row.userId);

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

        });
        this.fileList = response;
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
        // 发起 GET 请求获取文件
        const response = await fetch(`/api/file/download/${file.fileId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`, // 添加 Authorization Header
          },
        });

        // 检查响应状态
        if (!response.ok) {
          throw new Error(`网络错误，状态码：${response.status}`);
        }

        // 提取文件名
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = 'downloaded_file';
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch && fileNameMatch[1]) {
            fileName = decodeURIComponent(fileNameMatch[1]); // 解码文件名，处理中文或特殊字符
          }
        }

        // 获取 Blob 数据
        const blob = await response.blob();

        // 创建 Blob 的 URL
        const url = window.URL.createObjectURL(blob);

        // 创建一个隐藏的下载链接
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName); // 设置下载的文件名
        document.body.appendChild(link);

        // 触发下载
        link.click();

        // 清理工作
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url); // 释放内存

        console.log('文件下载成功:', fileName);
      } catch (error) {
        console.error('文件下载失败:', error);
        alert('下载失败，请稍后重试'); // 提示用户
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

        });
        this.availableUsers = response;
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
          this.selectedUsers
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
    async startRecording(type) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.stream = stream;
        this.mediaRecorder = new MediaRecorder(stream);

        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
          this.audioChunks = [];
          this.openConfirmationDialog(type);
        };

        this.mediaRecorder.start();
        this.isRecording = true;
      } catch (error) {
        console.error("无法获取麦克风权限", error);
        this.$message.error("请检查麦克风权限！");
      }
    },
    stopRecording() {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
        this.stream.getTracks().forEach(track => track.stop());  // 停止流
        this.isRecording = false;
      }
    },
    async sendAudioMessage(type) {
      if (!this.audioBlob) return;

      try {
        // 创建消息对象
        const message = {
          id: this.$snowflake.generate(), // 消息 ID
          action: type == 1 ? "message" : "private", // 消息动作
          roomId: this.roomId,
          receiverId: type === 2 ? this.receiverId : '', // 如果是私聊，添加接收者 ID
          fileType: "webm", // 文件类型
          fileName: "audio.webm", // 文件名
        };


        // 通过 WebSocket 发送消息和音频
        webSocketService.sendAudioMessage(this.audioBlob, message, (response) => {
          console.log("语音消息发送成功，服务器响应:", response);

          // 刷新数据
          if (type === 1) {
            this.fetchChatRoomData(this.roomId);
          } else {
            this.fetchSingleChatRoomData(this.roomId, this.receiverId);
          }
        });

        // 清理音频数据
        this.audioBlob = null;
      } catch (error) {
        console.error("语音消息发送失败", error);
        this.$message.error("语音消息发送失败！");
      }
    },


    clearAudio() {
      this.audioBlob = null;
    },
    openConfirmationDialog(type) {
      ElMessageBox.confirm(
        '是否发送语音消息?',
        '确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info',
        }
      )
        .then(() => {
          this.sendAudioMessage(type) // 用户点击确认发送
        })
        .catch(() => {
          this.clearAudio() // 用户点击取消不发送，清空录音
        })
    },

    handleSendSuccess(response) {
      this.$message.success("文件发送成功！");

      //清空文件列表
      this.$refs.upload.clearFiles();
    },
    async httpIntercept({ file }) {
      try {

        // const { type } = data; // 获取传递的 type 参数

        // 生成消息头
        const metaData = {
          id: this.$snowflake.generate(), 
          action: this.currentUploadType == 1 ? "message" : "private", // 消息动作
          roomId: this.roomId,
          receiverId: this.currentUploadType  === 2 ? this.receiverId : '', // 如果是私聊，添加接收者 ID
          fileType: file.raw.type.split('/').pop(),  //截取 / 后面的内容
          fileName: file.name,
  
        };


        // 通过 WebSocket 发送文件数据
        webSocketService.sendAudioMessage(file.raw,metaData, (response) => {
          console.log("文件上传成功，服务器响应:", response);
          this.fetchChatRoomData(this.roomId);
          this.$refs.upload.clearFiles();
        });
      } catch (error) {
        console.error("文件上传失败:", error);
      }
    },
    handleFileChange(file, fileList) {
      this.httpIntercept({ file });
      console.log("文件选择变化:", file, fileList);
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
  /* width: 60vh; */
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

.upload-demo {
  margin-top: 10px;
  margin-right: 10px;
}
</style>