const socket=io();
const $messageForm=document.querySelector("#message-form");
const $messageFormInput=document.querySelector("input");
const $messageFormButton=document.querySelector("button");
const $location=document.querySelector("#send-location");
const $messages=document.querySelector("#messages");


const message_template=document.querySelector("#message-template").innerHTML;
const location_template=document.querySelector("#location-template").innerHTML;
const sidebarTemplate=document.querySelector("#sidebar-template").innerHTML;

const {username,room }=Qs.parse(location.search,{ignoreQueryPrefix:true});
const autoscroll=()=>{
    const $newMessage=$messages.lastElementChild;

    const newMessageStyles=getComputedStyle($newMessage);
    const newMessageMargin=parseInt(newMessageStyles.marginBottom);
    const newMessageHeight=$newMessage.offsetHeight + newMessageMargin;

    const visibleHeight=$messages.offsetHeight;

    const containerHeight=$messages.scrollHeight;

    const scrollOffset=$messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight<=scrollOffset){
        $messages.scrollTop=$messages.scrollHeight;

    }


    
}

socket.on("Message",(msg)=>{
    console.log("Hey new user!",msg);
    const html=Mustache.render(message_template,{
        username:msg.username,
        message:msg.text,
        createdAt:moment(msg.createdAt).format("h:mm a")
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();

})
socket.on("location_message",(message)=>{
    console.log(message);
    const html=Mustache.render(location_template,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format("h:mm a")
    })
    $messages.insertAdjacentHTML("beforeend", html);
})
socket.on("roomData",({ room,users })=>{
const html=Mustache.render(sidebarTemplate,{
    room,
    users
})
document.querySelector("#sidebar").innerHTML=html;

})


$messageForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    $messageFormButton.setAttribute("disabled","disabled");
    const message=e.target.elements.message.value;
    socket.emit("SendMessage",message,(error)=>{
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value="";
        $messageFormInput.focus();
        if(error){
            return console.log(error);
        }
        console.log("Message delivered!");
    })

})
$location.addEventListener("click",()=>{
    if(!navigator.geolocation){
        return alert("Geolocation is not supported by your browser!");
    }
    $location.setAttribute("disabled","disabled");
    navigator.geolocation.getCurrentPosition((position)=>{
    $location.removeAttribute("disabled");
       socket.emit("send-location",{
        latitude:position.coords.latitude,
        longitude:position.coords.longitude

       },()=>{
        console.log("Location shared!");
       })
    })
})

socket.emit("join",{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }

});
