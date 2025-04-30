const MessageSchema = new mongoose.Schema({
  from: String,
  msg: String,
  timestamp: String,
}, { timestamps: true });

const MessageModel = mongoose.model("Message", MessageSchema);
