import * as functions from 'firebase-functions';
// import * as request from 'request';
import { config }  from '../config';
import { flexMenuMsg } from '../flexmenu';

//[1]เพิ่ม dialogflow-fulfillment library
const { WebhookClient, Payload } = require('dialogflow-fulfillment');
import * as firebase from 'firebase-admin';

firebase.initializeApp({
  credential: firebase.credential.applicationDefault(),
  databaseURL: config.databaseURL
});

const db = firebase.firestore();

const region = "asia-east2";
const runtimeOptions: any = {
  timeoutSeconds: 4,
  memory: "2GB"
};

export const webhook = functions.region(region).runWith(runtimeOptions).https.onRequest((req, res) => {
    // console.log("LINE REQUEST BODY", JSON.stringify(req.body));
    // console.log("Dialogflow REQUEST BODY", flexMenuMsg);
    const _flexMenuMsg: any = flexMenuMsg;
    //[2] ประกาศ ตัวแปร agent
    const agent = new WebhookClient({ request: req, response: res });


    //[4] ทำ function view menu เพื่อแสดงผลบางอย่างกลับไปที่หน้าจอของ bot
    const viewMenu = (agents: any) => {
        //[5] เพิ่ม flex message

        //[6] ปรับการตอบกลับ ให้ตอบกลับผ่าน flex message ด้วย Payload
        return db.collection('Menu').get().then(snapshot => {
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            const itemData = {            
                "type": "box",
                "layout": "baseline",
                "action": {
                  "type": "message",
                  "label": data.name,
                  "text": data.name
                },
                "contents": [
                  {
                    "type": "icon",
                    "url": "https://scdn.line-apps.com/n/channel_devcenter/img/fx/restaurant_regular_32.png"
                  },
                  {
                    "type": "text",
                    "text": `${ data.price } บาท`,
                    "flex": 0,
                    "margin": "sm",
                    "weight": "bold"
                  },
                  {
                    "type": "text",
                    "text": data.name,
                    "size": "sm",
                    "align": "end",
                    "color": "#AAAAAA"
                  }
                ]
            }
            _flexMenuMsg.contents.body.contents[1].contents.push(itemData);
          })

          const payloadMsg = new Payload("LINE", _flexMenuMsg, {
            sendAsMessage: true
          });
          return agent.add(payloadMsg);
        });
    };


    //[3] ทำ intent map เข้ากับ function
    const intentMap = new Map();
    intentMap.set("View-menu", viewMenu);
    agent.handleRequest(intentMap);


    //[0] ดึงข้อมูลจาก request message ที่มาจาก LINE
    // const replyToken = req.body.events[0].replyToken;
    // const messages = [
    //   {
    //     type: "text",
    //     text: req.body.events[0].message.text //ดึง message ที่ส่งเข้ามา
    //   },
    //   {
    //     type: "text",
    //     text: JSON.stringify(req.body) //ลองให้พ่น สิ่งที่่ LINE ส่งมาให้ทั้งหมดออกมาดู
    //   }
    // ];

    // //ยิงข้อความกลับไปหา LINE (ส่ง response กลับไปหา LINE)
    // return await lineReply(replyToken, messages);
  });

  // const lineReply = async (replyToken: string, messages: any) => {
  //   const body = {
  //     replyToken: replyToken,
  //     messages: messages
  //   };
  //   return await request({
  //     method: "POST",
  //     uri: `${config.lineMessagingApi}/reply`,
  //     headers: config.lineHeaders,
  //     body: JSON.stringify(body)
  //   });
  // };
