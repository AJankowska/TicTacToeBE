const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname,'dist/tictactoe')));

app.get('*',(req,res)=>{
    res.sendFile(path.join(__dirname,'dist/index.html'));
});

const server = http.createServer(app);
const io = socketIO(server);

let waitingPlayer = null;
let waitingName = null;
let allPlayers=[];
let allNames=[];
io.on('connection',(socket)=>{
   
    
    /*socket.on('message',(text)=>{
        io.emit('message',(text));
    });
    socket.on("updateBoard",(board)=>{
        io.emit("updateBoard",(board));
    })*/
   socket.on("createPlayer",(name)=>{
    
    if(waitingPlayer){
        
        console.log("Zaczynamy grę");
        console.log(name);
        startGame(waitingPlayer,waitingName,socket,name);
        waitingPlayer = null;
        waitingName=null;
       
    }else{
        console.log(name);
        waitingPlayer=socket;
        waitingName=name;
        console.log("Czekaj na przeciwnika...")
    }
   })
   socket.on('PlayAgain',()=>{
        console.log("play..."+socket);
   })
    socket.on('disconnect',()=>{
        console.log('Socket disconnected');
    });
});

startGame = (player1,name1,player2,name2)=>{
   
    //start gry
    players=[player1,player2];
    names=[name1,name2];
   players.forEach(player=>player.emit('message',"Gramy!Zaczyna gracz "+names[0]+" !"));
    
   board = [" "," "," "," "," "," "," "," "," "];
    console.log(board);
    

    //wysłanie planszy
   
    players[0].emit('activeUpdateBoard',(board));
    players[1].emit('nonActiveUpdateBoard',(board));
    //pojedynczy ruch
   
    players.forEach((player,idx)=>{
        player.on("onTurn",(boardInd)=>{
            onTurn(idx,boardInd,names);
        });
    });
 
    onTurn = (playerInd,boardInd,names)=>{
        let name,otherPlayer,nextMove;
        playerInd==0?otherPlayer=1:otherPlayer=0;
        playerInd==0?name = "X":name="0";
        name=="X"?nextMove=names[1]:nextMove=names[0];
        board[boardInd]=name;
        if(checkforWin(board,name)!=="win"){
            if(checkforWin(board,name)=="remis"){
                
                players.forEach(p=>p.emit('nonActiveUpdateBoard',(board)));
                players.forEach(p=>p.emit('message',"remis"));
                players.forEach(p=>p.emit("restart",("remis")));
               
                 
            }
            else{
               players[otherPlayer].emit('activeUpdateBoard',(board));
                players[playerInd].emit('nonActiveUpdateBoard',(board));
                players.forEach(p=>p.emit('message','Teraz ruch gracza '+nextMove));
            }
        
        }else{
           players.forEach(p=>p.emit("restart",("wygrana")));
            players[playerInd].emit('message',"Wygrałeś");
            players[otherPlayer].emit('message',"Przegrałeś");
            players.forEach(p=>p.emit('nonActiveUpdateBoard',(board,winningNumbers)));
            
        }
      
        players[otherPlayer].emit('activeUpdateBoard',(board));
        players[playerInd].emit('nonActiveUpdateBoard',(board));
        
    }
 
   let winningNumbers = [];
    checkforWin=function(board,name){
        
        let arr = [];    
        winningCombos = [[0,1,2],[3,4,5],[6,7,8],[0,4,8],[2,4,6],[0,3,6],[1,4,7],[2,5,8]];
        yourCombo = [];
        //create arr of all blank spaces and yourCombo[] of your spaces
        for(let i =0; i<9; i++){
            if(board[i]==" ") arr.push(i);            
            if(board[i]==name) yourCombo.push(i);           
        }
        
        
        //check if you have winning combo and sign the combo arrWin[] to winningNumbers[]global.           
        for (let win of winningCombos){
             let suma =0;
             for(let j=0; j<3; j++){
                let arrWin=[];
                if (yourCombo.indexOf(win[j])!== -1) {
                    suma++;
                    arrWin.push(win[j]);
                    if(arrWin.length==3) this.winningNumbers=arrWin;
                }
                
             }                
             if(suma==3) return "win";
                           
         }
        if(arr.length==0)return "remis";
        console.log(this.winningNumbers);
    }
    
}
server.listen(port,()=>{
    console.log('Listenining...')
})