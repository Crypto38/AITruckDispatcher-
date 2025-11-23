function log(t){let b=document.getElementById("chatbox");let d=document.createElement("div");d.textContent=t;b.appendChild(d);b.scrollTop=b.scrollHeight;}
log("AITruckDispatcher v10 Loaded (Raw Mode C). Type a load.");

function sendIt(){
 let t=document.getElementById("user").value;
 if(!t) return;
 log("You: "+t);
 document.getElementById("user").value="";
 log("AI: Processed. (Final ZIP Version Installed)");
}
