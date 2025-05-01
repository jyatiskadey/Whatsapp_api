const MessageSchema = new mongoose.Schema({
  from: String,
  msg: String,
  timestamp: String,
  messageId: String, // 👈 new field

}, { timestamps: true });

const MessageModel = mongoose.model("Message", MessageSchema);
