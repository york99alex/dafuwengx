import type * as ts from 'typescript';
import * as tstl from 'typescript-to-lua';
import * as lua from "typescript-to-lua/dist/LuaAST";

import { addon_name } from '../addon.config';



const insert = (isf,ism,ist,isa,ip,port) => {
    return `
    _G["$$$$Monitor"] = {}
    _G["$$$$ADDMonitor"] = function(point)
        _G["$$$$Monitor"][tostring(point)] = true
    end
    _G["$$$$ISMonitor"] = function(point)
        return _G["$$$$Monitor"][tostring(point)] ~= nil
    end

    -- local function watch(event)
    --     local info = debug.getinfo(2,"nSl")
    --     local line = info.currentline
    --     local name = debug.getlocal(2,2)
    --     local value = debug.getlocal(2,3)
    -- end

    -- debug.sethook(watch,"l")


    local function NullFunction() end;
    local function insert(instance, key, value,base,option,custom_type)
        if instance == nil then
            return 
        end
        lastCallTime = currentTime
    ____table[#____table + 1] = {instance = instance, key = key, value = value,base = base,option = option,custom_type = custom_type}
    if state and open == false then
        open = true
        frame_send(nil)
    end
    end


    _G['$$$$insert'] = insert
    local __TS__TypeOf = ____lualib.__TS__TypeOf
    local __TS__SetDescriptor = ____lualib.__TS__SetDescriptor
    local __TS__Class = ____lualib.__TS__Class
    local __TS__StringSplit = ____lualib.__TS__StringSplit
    local __TS__ArraySlice = ____lualib.__TS__ArraySlice
    local __TS__ArrayIncludes = ____lualib.__TS__ArrayIncludes
    local __TS__New = ____lualib.__TS__New
    local __TS__Number = ____lualib.__TS__Number
    local __TS__ArrayFilter = ____lualib.__TS__ArrayFilter
    local __TS__Decorate = ____lualib.__TS__Decorate
    ____table = {}
    open = false
    local state = false
    
    -- ____lualib.__TS__Class = function(self)
    --     local c = {prototype = {}}
    --     c.prototype.__index = c.prototype
    --     c.prototype.constructor = c
    --     c.prototype.__newindex = function(instance, key, value)
    --         ${isf ? `if type(value) == "function" then
    --         return rawset(instance, key, value)
    --     end` : 'insert(instance,key,value)'}
    --         return rawset(instance, key, value)
    --     end
    --     return c
    -- end

    
    ____lualib.__TS__New = function(target, ...)
        local instance = setmetatable({}, target.prototype)
        instance:____constructor(...)
        insert(instance,"$$$$parent",getmetatable(instance))
        return instance
    end

    ____lualib.Map.prototype.set = function(self, key, value)
        local isNewValue = not self:has(key)
        if isNewValue then
            self.size = self.size + 1
        end
        self.items[key] = value
        if self.firstKey == nil then
            self.firstKey = key
            self.lastKey = key
        elseif isNewValue then
            self.nextKey[self.lastKey] = key
            self.previousKey[key] = self.lastKey
            self.lastKey = key
        end
        insert(self.items,key,value)
        return self
    end

    --    ____lualib.__TS__ClassExtends = function(target, base)
    --    target.____super = base
    --    local staticMetatable = setmetatable({__index = base}, base)
    --    setmetatable(target, staticMetatable)
    --    local baseMetatable = getmetatable(base)
    --    if baseMetatable then
    --        if type(baseMetatable.__index) == "function" then
    --            staticMetatable.__index = baseMetatable.__index
    --        end
    --        if type(baseMetatable.__newindex) == "function" then
    --            staticMetatable.__newindex = baseMetatable.__newindex
    --        end
    --    end
    --
--
    -- setmetatable(target.prototype, base.prototype)
    -- 
    -- if type(base.prototype.__index) == "function" then
    --     target.prototype.__index = base.prototype.__index
    -- end
    -- if type(base.prototype.__newindex) == "function" then
    --     target.prototype.__newindex = base.prototype.__newindex
    -- end
    -- if type(base.prototype.__tostring) == "function" then
    --     target.prototype.__tostring = base.prototype.__tostring
    -- end
    -- end

____lualib.Map.prototype.clear = function(self)
    self.items = {}
    self.nextKey = {}
    self.previousKey = {}
    self.firstKey = nil
    self.lastKey = nil
    self.size = 0
    insert(self.items,"$$$$all", nil,nil,delete,nil)
end
____lualib.Map.prototype.delete = function(self, key)
    local contains = self:has(key)
    if contains then
        self.size = self.size - 1
        local next = self.nextKey[key]
        local previous = self.previousKey[key]
        if next and previous then
            self.nextKey[previous] = next
            self.previousKey[next] = previous
        elseif next then
            self.firstKey = next
            self.previousKey[next] = nil
        elseif previous then
            self.lastKey = previous
            self.nextKey[previous] = nil
        else
            self.firstKey = nil
            self.lastKey = nil
        end
        self.nextKey[key] = nil
        self.previousKey[key] = nil
    end
    self.items[key] = nil
    insert(self.items,key, nil,nil,delete,nil)
    return contains
end

    function frame_send(self)
        GameRules:GetGameModeEntity():SetContextThink(
            DoUniqueString("timer"),
            function()
                if #____table > 0 then
                    do
                        local i = 0
                        while i < 3 do
                            local ____table_remove_result_0 = table.remove(____table)
                            if ____table_remove_result_0 == nil then
                                open = false
                                return 1
                            end
                            local instance = ____table_remove_result_0.instance
                            local key = ____table_remove_result_0.key
                            local value = ____table_remove_result_0.value
                            local base = ____table_remove_result_0.base
                            local option = ____table_remove_result_0.option
                            local custom_type = ____table_remove_result_0.custom_type
                            if instance == nil then
                                open = false
                                return
                            end
                            if option  then
                                local body = tostring(instance):gsub("table: ", "") .. "," .. class_name(nil, instance) .. (base or "") .. "," .. tostring(key) .. "," .. option
                                local request = CreateHTTPRequestScriptVM("POST", "http://${ip}:${port}/option")
                                request:SetHTTPRequestRawPostBody("text/plain", body)
                                request:SetHTTPRequestHeaderValue("Content-Type", "text/plain")
                                request:SetHTTPRequestHeaderValue("Accept", "text/plain")
                                request:Send(NullFunction)
                                return
                            else
                            local body = (((((((tostring(instance):gsub("table: ", "") .. ",") .. class_name(nil, instance)) .. (base or "") .. ",") .. tostring(key)) .. ",") .. getAddress(nil, value)) .. ",") .. (custom_type or getType(nil, value) or "")
                            local request = CreateHTTPRequestScriptVM("POST", "http://${ip}:${port}/post")
                            request:SetHTTPRequestRawPostBody("text/plain", body)
                            request:SetHTTPRequestHeaderValue("Content-Type", "text/plain")
                            request:SetHTTPRequestHeaderValue("Accept", "text/plain")
                            request:SetHTTPRequestAbsoluteTimeoutMS(-1)
                            request:Send(NullFunction)
                            i = i + 1
                            end
                        end
                    end
                    return GameRules:GetGameFrameTime() * 2
                else
                    open = false
                    return 1
                end
            end,
            GameRules:GetGameFrameTime()
        )
    end
    function getAddress(self, value)
        if value == nil then
            return "null"
        end
        if type(value) == "table" then
            if value.__self then
                return "userdata"
            end
            return tostring(value):gsub("table: ","")
        end
        if type(value) == "boolean" then
            return value and "1" or "0"
        end
        if type(value) == "function" then
            return tostring(value):gsub("function: ","")
        end
        return tostring(value)
    end
    function class_name(self, value)
        if type(value) == 'function' then
            return "function"
        end
        if value and value.constructor and value.constructor.name then
            return value.constructor.name
        else
            return "null"
        end
    end
    function getType(self, value)
        if value == nil then
            return "null"
        end
        if type(value) == "table" then
            if value.__self then
                return "userdata";
            end
            if value.constructor then
                return value.constructor.name
            end
        end
        return __TS__TypeOf(value)
    end
    
    
    ListenToGameEvent(
        "game_rules_state_change",
        function()
            local _state = GameRules:State_Get()
            if _state == 2 then
                state = true
                if state and open == false then
                    open = true
                    frame_send(nil)
                end
            end
        end,
        nil
    )
    `

}

const findfieldparen = (node: tstl.AssignmentLeftHandSideExpression) => {
    let list: string[] = [];

    const field = (root: tstl.TableIndexExpression) => {
        if (tstl.isIdentifier(root.table) && root.table.originalName) {
            list.push(root.table.originalName.toString())
        }
        if (tstl.isStringLiteral(root.index)) {
            list.push(root.index.value.toString())
            if (tstl.isTableIndexExpression(root.table)) {
                field(root.table);
            }
        }
    }
    if (tstl.isTableIndexExpression(node)) {
        field(node)
    }
    return list
}

const order = (list: string[]) => {
    const base = list.includes("prototype") ? "prototype" : "self"
    switch (list.length) {
        case 1: {
            return undefined
        }
        case 2: {
            return `"-${base}",${list[0]},"${list[1]}"`.replace("this", "self")
        }
        case 3: {
            return `"-${base}",${list[1]}.${list[2]},"${list[0]}"`.replace("this", "self")
        }
    }
}

//索引深度遍历查找结构
const IndexSearch = (node:lua.Expression) =>{
    let list:string[] = []
    
    const field = (root:lua.Expression) =>{
        if(lua.isTableIndexExpression(root)){
            field(root.table)
            if(lua.isIdentifier(root.table)){
                list.push(root.table.text.toString())
            }
            if(lua.isStringLiteral(root.index) || lua.isNumericLiteral(root.index)){
                list.push(root.index.value.toString())
            }
        }
        else{
            return 
        }
    }
    field((node as lua.TableIndexExpression))
    return list.join(".")
}

class CustomPrinter extends tstl.LuaPrinter {
    _program: ts.Program
    function:boolean | undefined
    map:boolean | undefined
    array:boolean | undefined
    table:boolean | undefined
    include:string[] | undefined
    ip:string | undefined
    port:number | undefined
    //写一个当==号赋值时候的打印
    public printVariableAssignmentStatement(statement: tstl.AssignmentStatement) {
        if(this.luaFile.includes("game/scripts/vscripts/utils")) return super.printVariableAssignmentStatement(statement);
        if(this.include && !this.include.some(e => this.luaFile.includes(e))) return super.printVariableAssignmentStatement(statement);
        const chunks: any[] = [];
        const parent = order(findfieldparen(statement.left[0]))
        if(parent == undefined){
            return super.printVariableAssignmentStatement(statement);
        }
        const joiov = this.joinChunksWithComma(statement.left.map(e => { return this.printExpression(e); }))
        chunks.push(this.indent());
        chunks.push(...joiov);
        chunks.push(" = ");
        chunks.push("vhook(");
        if (parent) {
            chunks.push(parent);
            chunks.push(",")
        }
        chunks.push(...this.joinChunksWithComma(statement.right.map(e => this.printExpression(e))));
        chunks.push(")")

        return this.createSourceNode(statement, chunks);
    }

    printNumericLiteral(expression: lua.NumericLiteral) {
        if(this.luaFile.includes("game/scripts/vscripts/utils")) return super.printNumericLiteral(expression)
        if(this.include && !this.include.some(e => this.luaFile.includes(e))) return super.printNumericLiteral(expression)
        
        return super.printNumericLiteral(expression)
    }

    printBlock(block: lua.Block) {
        const chunks: any[] = [];
        if(this.luaFile.includes("game/scripts/vscripts/utils")) return super.printBlock(block);
        if(this.include && !this.include.some(e => this.luaFile.includes(e))) return super.printBlock(block);
        chunks.push(this.indent());
        block.statements.forEach(statement => {
            if(lua.isAssignmentStatement(statement)){
                chunks.push("\n");
                chunks.push(this.printStatement(statement));
                chunks.push("\n");
                if(statement.left[0] && lua.isTableIndexExpression(statement.left[0])){
                        const field = IndexSearch(statement.left[0].table)
                        // IndexSearch(statement.left[0].table)
                        chunks.push("thook(");
                        if(field){
                            chunks.push(field)
                            chunks.push(",")
                        }else{
                            chunks.push(this.printExpression(statement.left[0].table))
                            chunks.push(",")
                        }
                        let newBinary;
                        if(lua.isBinaryExpression(statement.left[0].index)){
                            const left = lua.createBinaryExpression(statement.left[0].index.left,statement.left[0].index.right,statement.left[0].index.operator)
                            newBinary = lua.createBinaryExpression(left,lua.createNumericLiteral(1),tstl.SyntaxKind.SubtractionOperator)
                            chunks.push(this.printExpression(newBinary))
                        }else{
                            chunks.push(this.printExpression(statement.left[0].index))
                        }
                        chunks.push(",")
                        if(newBinary){
                            chunks.push(this.printExpression(newBinary))
                        }else{
                            chunks.push(this.printExpression(statement.left[0]))
                        }
                        chunks.push(")\n")
                        chunks.push(this.indent());
                //    if(lua.isIdentifier(statement.left[0].table)){
                //         console.log(statement.left[0].table)
                //         console.log(statement.left[0])
                //    }
                }
            }else{
                chunks.push("\n");
                chunks.push(this.printStatement(statement))
                chunks.push("\n");
            }
        });
        return this.createSourceNode(tstl.createBlock([]), chunks);
    }
    
    // printVariableDeclarationStatement(stastatement: lua.VariableDeclarationStatement) {
    //     if(this.luaFile.includes("game/scripts/vscripts/utils")) return super.printVariableDeclarationStatement(stastatement);
    //     if(this.include && !this.include.some(e => this.luaFile.includes(e))) return super.printVariableDeclarationStatement(stastatement);
    //     const chunks:any[] = [];
    //     chunks.push(this.indent());
    //     chunks.push("vhook(");
    //     chunks.push(...this.joinChunksWithComma(stastatement.left.map(e => this.printExpression(e))));
    //     if(stastatement?.right?.length && stastatement?.right?.length> 0){
    //         chunks.push(",")
    //         chunks.push(...this.joinChunksWithComma(stastatement.right.map(e => this.printExpression(e))));
    //     }
    //     chunks.push(")")
    //     console.log(stastatement.right)
    //     return this.createSourceNode(stastatement, chunks);
    // }

    // printVariableDeclarationStatement(statement: tstl.VariableDeclarationStatement) {
    //     const chunks: any[] = [];
    //     if(statement.left[0].text == "caonima"){
    //         console.log(statement)
    //         chunks.push(this.indent());
    //         chunks.push("print(");
    //         chunks.push(...this.joinChunksWithComma(statement.left!.map(e => this.printExpression(e))));
    //         chunks.push(")");
    //     }
    //     return this.createSourceNode(statement, chunks);
    // }

    // printIdentifier(expression: tstl.Identifier) {
    //     const chunks: any[] = [];
    //     if(expression.text == "caonima"){
    //         console.log(expression)
    //     }
    //     return this.createSourceNode(expression, chunks);
    // }


    Init(){
       const arr = this._program.getCompilerOptions().luaPlugins as unknown as {ip:string,port:number,include:string[],name:string,function:boolean,map:boolean,table:boolean,array:boolean}[]
       this.function = arr.find(e=>e.name.includes("magpie"))?.function 
       this.map = arr.find(e=>e.name.includes("magpie"))?.map
       this.array = arr.find(e=>e.name.includes("magpie"))?.array
       this.table = arr.find(e=>e.name.includes("magpie"))?.table
       this.include = arr.find(e=>e.name.includes("magpie"))?.include
       this.ip = arr.find(e=>e.name.includes("magpie"))?.ip
       this.port = arr.find(e=>e.name.includes("magpie"))?.port

    }

    constructor(program: ts.Program, emitHost: tstl.EmitHost, fileName: string, file: tstl.File){
        super(emitHost, program, fileName)
        this._program = program
        this.Init()
    }
}

const vhook = (ist) =>`
    local customClass = function(val,classname)
        if type(val) ~= "table" then return false end
        return val and val.constructor and val.constructor.name == classname
    end

    local thook = function(Param1,Param2,Param3)
        if _G["$$$$ISMonitor"](Param1) then
            _G["$$$$insert"](Param1,Param2,Param3,nil,nil,nil)
        end
    end

    local vhook = 
    function (base,Param1,Param2,Param3) 
    local _type 
    local _p3 = Param3
    if customClass(Param3,"Map") then
        _type = "Map"
        _p3 = Param3.items
    end
    if Param3 and type(Param3) == "table" and not Param3.constructor then
        _type = "table"
        _G["$$$$ADDMonitor"](Param3)
        print("注册了一个table",tostring(Param3))
    end

    if _G['$$$$insert'] then _G['$$$$insert'](Param1,Param2,_p3,base,nill,_type) end
    return Param3 
    end
`

const plugin: tstl.Plugin = {

     
    beforeEmit(program: ts.Program, options: tstl.CompilerOptions, emitHost: tstl.EmitHost, result: tstl.EmitFile[]) {
        const arr = program.getCompilerOptions().luaPlugins as unknown as {ip:string,port:number,name:string,function:boolean,map:boolean,table:boolean,array:boolean}[]
        const isf = arr.find(e=>e.name.includes("magpie"))?.function 
        const ism = arr.find(e=>e.name.includes("magpie"))?.map
        const isa = arr.find(e=>e.name.includes("magpie"))?.array
        const ist = arr.find(e=>e.name.includes("magpie"))?.table
        this.ip = arr.find(e=>e.name.includes("magpie"))?.ip
        this.port = arr.find(e=>e.name.includes("magpie"))?.port
        void program;
        void options;
        void emitHost;
        const pattern = /require\(['"]lualib_bundle['"]\)/;
        for (const file of result) {
            // @ts-expect-error
            const name = file.fileName;
            file.code = `${vhook(ist)}\n${file.code}`
            if (name.endsWith(`addon_game_mode.ts`)) {
                const date = new Date();
                const match = pattern.exec(file.code);
                if (match) {
                    const index = match.index + match[0].length;
                    file.code = `${file.code.substring(0, index)}\n${insert(isf,ism,ist,isa,this.ip,this.port)}\n${file.code.substring(index)}`;
                }
            }
        }
    },
    printer: (program: ts.Program, emitHost: tstl.EmitHost, fileName: string, file: tstl.File) => {
        return new CustomPrinter(program, emitHost, fileName,file).print(file)
    }
};

export default plugin;