//1.import mongoose
const mongoose=require('mongoose')

//2.Create connection string
const connection_string=process.env.connectionString

//3.define connection
mongoose.connect(connection_string).then(res=>{
    console.log("pF server connect with mongodb");
    
}).catch(err=>{
    console.log("Error" +err);
    
})