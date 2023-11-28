萌新开发笔记, 一款基于DOTA2游廊开发的拥有独特技能和玩法的大富翁游戏

开发中略略略...



# 刀富翁

在天辉和夜宴的彼岸，存在着一片远古遗迹，这里的英雄们受到时间之外的约束，他们要占领彼此的领地，以金钱为唯一标准角逐出最强的刀富翁，获得永恒的宝藏。

——————————————————
●游戏类型：大富翁 塔防
●游戏人数：2-6人
●游戏特色：DotA风格的大富翁，存在英雄、技能、装备、属性等机制，同时也结合大富翁玩法融合出多种随机事件，期待你的探索。
注：支持本地主机游玩。
——————————————————
欢迎加入交流QQ群：691590881
个人独立开发，如遇BUG请谅解和反馈，项目参考大将军。本项目开源Github：york99alex/dafuwengx



# 什么是策划

- 英雄的设计
  1. 以DOTA2地图的特点和机制为基础来设计
  2. 要有自己的设计理念和目标
  3. 策划英雄要有同比,对比
- 装备的设计
  1. 使用原有的DOTA2装备
  2. 修改原有的DOTA2装备
  3. 策划全新的装备(需要匹配DOTA2机制和特点)
- 地图的世界观
- 英雄的故事背景
- 角色的原画,模型,特效等(可以先用文字描述)
- 本地化文件



# 英雄设计

- 特点
- 定位
- 结合特点和定位设计技能
- 技能数值和属性等就类似填表
- 数值/平衡问题

## 容易遇到的问题/陷阱

- 使用时机/CD时间
- 是否同质化
- 连招配合
- 平衡性,连招平衡性
- 双方英雄之间的技能交互
- 新的英雄定位不明确可能回导致原本的英雄失去使用价值





# 编辑器

DLC，Workshop Tools DLC

<img src="https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/06/18/11-00-54-5254c4d3daf0e32b8b2692f2b1076438-image-20230618110054406-f57761.png" alt="image-20230618110054406" style="zoom:50%;" />



## Tools

- Hammer 地图编辑器
- 

## Hammer

地图编辑器，仅可打开启动项目文件夹下的vmap。

### 打开地图

快捷键F9 run map打开地图，第一次要build。

### 笔刷法编辑地图

[笔刷法制作地形|dota2 rpg AMHC -](http://www.dota2rpg.com/forum.php?mod=viewthread&tid=1853&extra=page%3D1)



## VConsole2

控制台, 游戏窗口按 `\` 打开

- 单独新窗口过滤信息:
  <img src="https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/06/27/18-35-09-c03d77452a9188c4729113181ecec6d5-image-20230627183509476-3bac9d.png" alt="image-20230627183509476" style="zoom:50%;" />
- Filter搜索左侧Channel
- Search搜索右侧Log
- Command命令:
  - clear清屏
  - script_reload是重新载入lua代码
  - dota_launch_custom_game [项目名] [地图名] 启动项目进入游戏
  - script_help2  打印所有api接口
  - dota_create_unit npc_dota_roshan enemy
    dota_create_unit npc_dota_hero_axe enemy
  - dota_kill_unit_by_name npc_dota_roshan


## 技能

scripts\npc

==在游戏运行的时候，你能够使用`script_reload`命令来重新载入你的代码。==

- npc_abilities_custom.txt	去定义修改的技能
- npc_heroes_custom.txt  并不是创建新英雄的,而是让你用现有英雄作为模板然后去覆盖和修改,去定义如何修改
- npc_items_custom.txt
- npc_units_custom.txt

[脚本常量 - Valve Developer Community (valvesoftware.com)](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools:zh-cn/Scripting:zh-cn/Constants:zh-cn) 

### 技能的制作类型

- 数据驱动类: 
  KV文件(key-value) 继承或者修改已有技能	`"BaseClass"	  "ability_datadriven"`
  特点: 编写快速(配合[KV编辑器](http://www.dota2rpg.com/forum.php?mod=viewthread&tid=3727&extra=page%3D1)更方便), 但是灵活性相比其他两种不足, 同时会受本体变化而影响
- 数据驱动与Lua代码并行
  将部分数据驱动的内容通过lua来实现
- Lua脚本类: 在技能定义中调用Lua函数, 可以创造更有趣的技能
  代码量较大, 但逻辑更清晰更灵活
  可以通过地图中重载代码,快速调试技能 `script_reload` 

### KV编辑技能

- **技能图标	AbilityTextureName**
  图标的文件存放路径: game\dota_addons\项目名\resource\flash3\images\spellicons下面

  V值为文件前缀,不加后缀,可以在spellicons下有自定义子文件, 例如 `\my\head` 就是\spellicons\my文件夹下的head.png

  对应 npc_abilities_custom.txt 文件中技能定义时的 `AbilityTextureName` KV值

  - 处理图片
    要求128*128像素, png格式

- **技能行为	AbilityBehavior**

  - 可读性较好, 注意AOE技能一般配合点目标等使用
    ![image-20230627171736175](https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/06/27/17-17-36-1d979b1fee54a59b606b0f7992ef58d8-image-20230627171736175-e60f3c.png)

- 最大等级 MaxLevel
  dota2 默认5级

- 需求等级 RequiredLevel
  大富翁里是10级

- 施法前摇 AbilityCastPoint

- 施法动作 AbilityCastAnimation

  - 查看施法动作的方法:
    在资源管理器Asset Browser中查找model
    <img src="https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/06/27/17-23-12-3a7181e4017beec0986bb5dfeda0dd6e-image-20230627172312570-d82354.png" alt="image-20230627172312570" style="zoom:50%;" />
    然后过滤你想查看的英雄,名字+.vmdl才是英雄模型,其他都是饰品等,例如我查看puck
    <img src="https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/06/27/17-24-21-6c1c6360ced7f012537d739a22355da7-image-20230627172421778-c658a7.png" alt="image-20230627172421778" style="zoom:50%;" />
    在右侧Compiled Preview Outliner下的Animation Sequences中就是动画序列
    <img src="https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/06/27/17-32-05-829bb76dc21aeca302aea364221b7d2b-image-20230627173205295-bd5645.png" alt="image-20230627173205295" style="zoom: 33%;" />
    **后面全大写的灰色字段就是要在AbilityCastAnimation填写的V值**
  - 也可以在SpellLibraryLua里通过这个[vscripts](https://github.com/vulkantsk/SpellLibraryLua/tree/master/game/SpellLibraryLua/scripts/vscripts)查看, 在英雄名文件夹下找技能名然后查看方法StartGesture(ACT_DOTA_CAST_ABILITY_3)里的字段

### 事件

事件类型就是触发条件

操作就是触发条件后做什么

- Target: 
  - None
  - CASTER
  - TARGET
  - POINT
  - ATTACKER
  - UNIT
  - [Group Units]  可以按范围或脚本等

#### 特效

触发某些事件时能选择添加特效KV信息

- FireEffect 等事件可以触发特效时会有
  - EffectName 特效文件.vpcf
    查看特效文件, 同上使用资源管理器查看模型
    ![image-20230627174533506](https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/06/27/17-45-33-2b1bf8c045efee651add424b299dbeeb-image-20230627174533506-ca0de9.png)
    然后查看右键选择 copy path即可
    <img src="https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/06/27/17-52-39-dabaecdea5ef41018d04b7f4ec0cccd0-image-20230627175239396-6bda80.png" alt="image-20230627175239396" style="zoom: 50%;" />
- FireSound 触发声音特效
  - EffectName  声音文件
    通过这个仓库查看[vscripts](https://github.com/vulkantsk/SpellLibraryLua/tree/master/game/SpellLibraryLua/scripts/vscripts), 在英雄名文件夹下找技能名然后查看方法EmitSound("Hero_Axe.CounterHelix")里的字段
- SourceAttachment  特效附着点,可以理解为特效从哪里发出
  - 也是在资源管理器Model里查看Attachments
    <img src="https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/06/27/17-56-51-76bff684fb10be538d3317942f7e3369-image-20230627175651930-2ce3f8.png" alt="image-20230627175651930" style="zoom: 80%;" />
    填写KV值时改为全大写同时加上前缀例如:
    DOTA_PROJECTILE_ATTACHMENT_ATTACK1

一个特效往往由多个子特效组成.
视觉特效文件右下角有P的表示Parent为父类特效,包含所有子类特效; 右小角为C的表示Children,是最子级的特效. 点击其图标可以看到继承树, 点击继承树中的格子可以跳到该特效.
导入特效时一般导入父级特效

<img src="https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/06/27/17-47-59-7b30d7568602b2c882c4d64747039278-image-20230627174759456-d8607b.png" alt="image-20230627174759456" style="zoom:67%;" />



### 修饰器

修饰器在事件里调用, 修饰器可以理解成buff, 可以添加增益,减益,特效等.

修饰器也能添加特效和事件.

修饰器可以定义为可见的和不可见.





# vscripts

DOTA中只是用了Lua语言的一部分特点.

在DOTA2中Lua的特点:

- 灵活性远高于数据驱动类
- 可以在地图中快速重载
- 缺点,代码量大

数据类型: 赋值时不用声明变量

- nil
- boolean
  false, nil为假, 其余都为真, 1和0都是真

- number  不区分整数, 小数
- string
- table可以是数组array也可以是KV键值对
  - 可以通过table来实现伪类, 具有类的特性


function：c或lua编写的代码

require(“hello”) --引用hello.lua，默认同目录

lua中.点号是其某个属性/函数，:冒号是调用函数。

- self是本身
  https://zhuanlan.zhihu.com/p/115159195?utm_id=0 

==如果通过KV调用Lua函数, 则传入方法的参数为table封装包含caster, target, ability==
例如: keys.caster
而纯Lua代码, 是使用self:GetCaster(), 调用函数向系统询问



## 语法规范

- 大小写字母, 下划线, 数字构成, 但不能以数字开头

- 保留字不能使用

- 注释:
  ```lua
  -- 单行注释
  
  --[[
  	多行注释
  --]]
  
  ---[[
  	取消多行注释
  --]]
  ```



## Lua技能

在技能定义的BaseClass中填写V值为 ability_lua
 ScriptFile根目录在项目文件夹\vscripts下, 例如:

```kv
"LuaAbility_phantom_strike"
{
	"BaseClass"					"ability_lua"
	"ScriptFile"				"Ability\phantom_assassin\LuaAbility_phantom_strike"
```

就是在<img src="https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/06/27/18-45-26-c24568ab2a1d15c5fd5d9223b672114e-image-20230627184526763-3c4301.png" alt="image-20230627184526763" style="zoom: 67%;" />**不用写文件后缀**

那么正式开始lua编写技能, lua技能一般先**创建一个lua类**, 用于定义技能的行为和属性, 类的定义通常会包含技能的各种方法和技能执行时的逻辑等.

```lua
test_lua_ability = class ({})
-- 大富翁里斧王的战斗饥渴文件最开始是这样的:
require("Ability/LuaAbility")

if nil == LuaAbility_axe_battle_hunger then
    LuaAbility_axe_battle_hunger = class({}, nil, LuaAbility)
    LinkLuaModifier("modifier_luaAbility_axe_battle_hunger", "Ability/axe/LuaAbility_axe_battle_hunger.lua", LUA_MODIFIER_MOTION_NONE)
    if PrecacheItems then
        table.insert(PrecacheItems, "particles/units/heroes/hero_axe/axe_battle_hunger.vpcf")
    end
end
```





## 常用函数

- print
- LinkLuaModifier  将lua定义的修饰器与关联的类链接起来
  - ( className, fileName, LuaModifierType) 三个参数
    - LuaModifierType 运动类型, 由以下五个常量
      - LUA_MODIFIER_MOTION_NONE	0	没有运动效果
        LUA_MODIFIER_MOTION_HORIZONTAL	1	在水平方向上移动
        LUA_MODIFIER_MOTION_VERTICAL	2	在垂直方向上移动
        LUA_MODIFIER_MOTION_BOTH	3	在水平和垂直上都移动
        LUA_MODIFIER_INVALID	4	
- GetOrigin()  获取位置
- GetCaster()  获取施法者
- GetTeamNumber()  获取队伍ID
- EntIndexToHScript  游戏里面所有的单位每个人都有一个id来记录他, 这个函数通过这个id来获取到这个单位本身，也就是lua技能中常用的caster
- Dynamic_Wrap()





#### API

![image-20230704104746959](https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/07/04/10-47-47-5aa1fcf0b1d8004f3f6b3d574fb14b02-image-20230704104746959-124d29.png)



## 预加载

对于特效，需要在技能定义中预载入。
lua定义的技能在kv编辑器里有预载入键值。
其值填写只用从particle开始

lua定义技能时self是使用技能的实例，可以通过self: 调用函数
数据驱动时不能使用self: 调用方法，而是self.caster /target 来获取其参数值，self是一个keys的table，可以print出来看有什么东西。

预加载，分为全局和部分英雄加载，全局预加载内容越多地图选人前加载越慢。
建议将不是全局调用的特效/音频放在英雄npc_hero里预加载



## 计时器功能

目的: 制作持续伤害, 延时伤害, 控制等
注意: 计时器的触发是在时间到后才会触发第一次

通过KV编辑时, 计时器是属于修饰器里的事件 `OnIntervalThink`, 而非直接技能的事件



Lua实现:

![image-20230703164427009](https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/07/03/16-44-27-4b089c77bec7b2d369e946f73cab4495-image-20230703164427009-44de12.png)

1. 链接修饰器

2. 给目标添加修饰器

3. 注册修饰器, 定义OnCreated函数(启动计时器)

   ```lua
   --设置定时器, 参数为间隔时间
   self:StartIntervalThink(1)
   --定时器间隔调用该函数
   self:OnIntervalThink()
   ```

   

## 范围效果

对多个目标的操作, 实现方法可以是范围搜索, 线性搜索或者使用Lua脚本搜索

`FindUnitsInRadius`(team: [DOTATeam_t](https://moddota.com/api/#!/vscripts/DOTATeam_t), location: [Vector](https://moddota.com/api/#!/vscripts/Vector), cacheUnit: [CBaseEntity](https://moddota.com/api/#!/vscripts/CBaseEntity) | nil, radius: float, teamFilter: [DOTA_UNIT_TARGET_TEAM](https://moddota.com/api/#!/vscripts/DOTA_UNIT_TARGET_TEAM), typeFilter: [DOTA_UNIT_TARGET_TYPE](https://moddota.com/api/#!/vscripts/DOTA_UNIT_TARGET_TYPE), flagFilter: [DOTA_UNIT_TARGET_FLAGS](https://moddota.com/api/#!/vscripts/DOTA_UNIT_TARGET_FLAGS), order: [FindOrder](https://moddota.com/api/#!/vscripts/FindOrder), canGrowCache: bool): [[CDOTA_BaseNPC](https://moddota.com/api/#!/vscripts/CDOTA_BaseNPC)]

全局函数Finds the units in a given radius with the given flags. 

FindOrder:

FIND_ANY_ORDER = 0	(填0的话较合适)

FIND_CLOSEST = 1	(从最近开始)

FIND_FARTHEST = 2	(从最远开始)



## 循环

break退出当前循环

Lua没有continue

Lua实现宙斯闪电链[【彩紫睨羽】《DOTA2》编辑器进阶篇-第19期--跟踪投射物下_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1bJ411K7KX/)



## 替身(马甲)

非指向性技能, 需要一个"点位置"来实现技能

例如,炸弹人地雷,电狗草莓



## 护盾

![image-20231109112827410](https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/11/09/11-30-35-4df23e90cd232f4fb3be3996a3350164-image-20231109112827410-35e6f7.png)



# 机制

[Game Events](https://moddota.com/api/#!/events)

Dynamic_Wrap(context: table, name: string)

A function to re-lookup a function by name every time.



## 近战英雄伤害格挡

CDOTABaseGameMode extends CBaseEntity

==SetInnateMeleeDamageBlockAmount==(amount: int): nil
	Set the amount blocked innately by melee heroes.





# UI



## panorama

Panorama 用户界面，用来在您的游戏模式中自定义界面
以类似编写html网页的形式来编写游戏UI

[官方开发文档-Panorama](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/Panorama:zh-cn)



## 如何绑定快捷键

[如何绑定快捷键 (shimo.im)](https://shimo.im/docs/XKq4M9lR8VcE4lkN/read)



## 关闭小地图

[Hiding HUD with SetHUDVisible](https://moddota.com/panorama/hiding-hud-with-sethudvisible)

前端:

```tsx
GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_HUD_VISIBILITY_ACTION_MINIMAP, false);
```



# 本地化

addon_schinese.txt 是本地化文件，可以修改技能描述等。
 Lore是传记描述
 Note是技能补充描述 Note0 Note1按住alt时技能额外显示的内容
 npc_abilities_custom.txt中定义特殊值，再在本地化文件中用%%调用



# TS+X-template

Nodejs + TypeScritp 

编辑器原版开发环境:
前端: javascript + css(阉割版) + xml
后端: lua KV数据文件

X-template:
前端: react基于javascript的一个优秀库scss(css升级版) + 基于webpack babel的统一打包项目
后端: typescripttolua 将ts代码编译成lua

## Node

[NPM第三方库](https://www.npmjs.com/)

编译:npx tsc

运行: node .编译文件路径.js



## X-template

1. `yarn dev`，开始你的开发
2. 如果你要启动你的项目，你可以使用指令`yarn launch map_name`启动游戏并载入地图，或者使用`yarn launch`只是启动工具而不载入地图，之后再在控制台使用指令载入地图。



### 项目路径

- .vscode	控制vs显示输入
- content  客户端文件夹, 每个玩家都有
  - maps
  - panorama UI文件
    - layout\custom_game 模板编译后UI文件
    - src  模板编译前UI文件
    - tsconfig.json  关于客户端文件ts语言的设置
- excels  编辑项目中所用到的KV,会自动转换成game/scripts下的txt
- game  服务端文件
  - game_mode.ts  游戏的入口
- scritps  xtemplate所使用的文件, 与游戏项目无关,可忽略

### 模块化编程

在没有使用X-template时, dota2的js不支持模块化编程, X-template使用webpack转译和特殊手段实现
(词法分析器, AST树, 将代码转换为类似JSON的规则字符串集, 再转换为其他语言)

引入模块

```tsx
import { abc } from "./test"

	//
	const test = abc()
```

编写模块同时导出

```tsx
export const abc = () => {
    
}
```



### 网表CustomNetTables

在X模板中需要在两个地方定义需要用的网标:

1. game\scripts\custom_net_tables.txt 里定义table name
2. game\scripts\src\shared\net_tables.d.ts 里详细定义table,key,value



## TypeScript

npm --init	初始化js项目
npx tsc --init	初始化ts项目(typescript是js的超集) 生成编译器配置文件, 修改rootDir和outDir路径
每次编译ts文件运行 npx tsc

TypeScript只是一种强类型推断的语言, 并不能直接执行, 而是要编译成其他代码, 比如Javascript才能在node环境里执行.

[TypeScript 教程](https://www.runoob.com/typescript/ts-tutorial.html)

### 语法

略, 较丰富, 支持continue

#### 变量

let 声明变量, 可以重新赋值
const 声明常量, 不能重新赋值, (声明对象，然后修改对象中的属性可以)

#### 类Class

```tsx
class Car { 
   // 字段
   engine:string; 
   
   // 构造函数
   constructor(engine:string) { 
      this.engine = engine 
   }  
   
   // 方法
   disp():void { 
      console.log("函数中显示发动机型号  :   "+this.engine) 
   } 
} 
 
// 创建一个对象
const obj = new Car("XXSY1")
 
// 访问字段
console.log("读取发动机型号 :  "+obj.engine)  
 
// 访问方法
obj.disp()
```



#### map和循环

https://www.jiyik.com/tm/xwzj/web_834.html



#### 方法

##### Timer



#### 立即调用

通过匿名函数定义并立即调用得到返回值的写法:

```typescript
        tabOprt["nRequest"] = (() => {
            if (tabData.nRequest == 1) {
                if (!path) {
                    return 100
                }
                if (path.m_nOwnerID == tabOprt["nPlayerID"]) {
                    return 2    // 自己领地
                } else if (path.m_nPlayerIDGCLD) {
                    return 3    // 已在攻城中
                }
            }
            return tabData.nRequest
        })()
```

### 引入第三方库

https://www.npmjs.com/

[第三方库的使用与typescript_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1n44y1e7B4?p=3)



## 编写技能Ability

.\excels\kv.xlxs	通过这个excel编写所有于kv相关的,包括英雄, 技能, 物品等

对应转换为game\scripts\npc\abilities.txt 文件



```tsx
@reloadable		// script_reload时可以重载技能
@registerAbility()		// 注册到DOTA技能中

=========================
import '../modifier/test_modifier'	// 引入一个修饰器(引入路径+字符串类名)
```



## 编写物品Item





## TS的Modifier

```typescript
@registerModifier()
export class modifier_XXX extends BaseModifier { }
```



## React

视频教程: [尚硅谷React教程（2022加更，B站超火react教程）](https://www.bilibili.com/video/BV1wy4y1D7JT?spm_id_from=333.1245.0.0)

笔记: https://github.com/xzlaptt/React



### 函数式组件写法

```tsx
/**
 * export导出, 作为组件再别处调用
 */
export const OprtTip = () => {
	return <Pannel></Pannel>
}

// 调用:
render(<OprtTip />, $.GetContextPanel())
```

### 解构赋值

const {value} = props

### ES6扩展运算符

灵活运用

### 组件间通信

例如: App为根组件, 包含Header List两个子组件, 

通过Header子组件获取到一个值要传递给List

```tsx
export const Hearder = ()=>{
    handleKeyUp = (event)=>{
        this.props.addTodo(event.Code)
	}
    
    render () {
        return <input onKeyUp = {this.handleKeyUp} />
    }
}
```

先通过 App根组件中, 给Header组件定义时传入一个函数:

```tsx
export const App = () => {	// 根组件
    addTodo = (data)=>{
        // data就能接收到Hearder里调用this.props.addTodo(event.Code)传入的event.Code参数
    }
    
    render(){
        return <Header addTodo={this.addTodo}/>
    }
}
```

这就实现了子组件给父组件传递消息



### 注意

- 尽量不要在需要回调的地方写内联函数, 应写绑定函数



# 附注

## 链接/学习视频：

- [【Dota2】游廊地图制作教程-新手项01期 如何下载游廊地图编辑器和上传地图_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1Qc411J76i/)
- [彩紫睨羽的个人空间_哔哩哔哩_bilibili](https://space.bilibili.com/345688919/video?tid=0&pn=4&keyword=&order=pubdate)
- [Dota 2 创意工坊工具集 - Valve Developer Community (valvesoftware.com)](https://developer.valvesoftware.com/w/index.php?title=Dota_2_Workshop_Tools&uselang=zh)
- [Introduction | ModDota](https://moddota.com/)
  - [API | ModDota](https://moddota.com/api/#!/vscripts)
- 一些定义DOTA函数的仓库
   https://github.com/ModDota/API/blob/master/examples/vscript/declarations/dota-api.d.ts
- DOTA2技能Lua库 
   - https://github.com/Elfansoer/dota-2-lua-abilities
   - https://github.com/vulkantsk/SpellLibraryLua

- [ts+xtemplate](https://www.bilibili.com/video/BV1n44y1e7B4?p=1)
- [火蛙-KV键值文档](https://docs.qq.com/sheet/DZUVFaVVobmptQ2Rl)
- TS教程:
   - [TypeScript 入门教程](https://ts.xcatliu.com/)
   - [ 深入理解 TypeScript](https://jkchao.github.io/typescript-book-chinese/)
- 地图编辑器Hammer教学 [鸽子群来了个做地图的年轻人-LV1-](https://www.bilibili.com/video/BV1qx411g7eT/?spm_id_from=333.788.recommend_more_video.-1)
- 云端-石墨文档-[Dota2游廊新手入门教程 (shimo.im)](https://shimo.im/docs/rp3OVyBdxjtnBmAm/read)
   - [游戏中传递数据的几种方式 (shimo.im)](https://shimo.im/docs/VMAPVQeg5pU1lXqg/read)
   - [如何绑定快捷键 (shimo.im)](https://shimo.im/docs/XKq4M9lR8VcE4lkN/read)
- [Dota2常用测试-作弊-指令大全（含物品中英对照）](https://www.magese.com/2020/12/28/Dota2%E5%B8%B8%E7%94%A8%E6%B5%8B%E8%AF%95-%E4%BD%9C%E5%BC%8A-%E6%8C%87%E4%BB%A4%E5%A4%A7%E5%85%A8/)

## ==文件目录/路径==

- ..\SteamLibrary\steamapps\common\dota 2 beta 本体目录
  - ==\content==  编译前文件，地图等资源
    - \dota
      - \maps
        - \dota.vmap  本体地图
    - **==\dota_addons==**   游廊项目文件
      - ..项目名
        - maps 默认, .vmap文件
        - materials 默认 模型贴图
        - particles 默认, 特效.vpcf文件
        - panorama (自己创建) UI文件,使用编写html页面的方式来编写(自己创建)
        - models (自己创建) 存放自己的模型文件 .vmdl文件
        - sounds (自己创建) 存放声音文件
    
  - ==\game==  编译后文件，lua代码
    
    - **==\dota_addons==**   游廊项目文件
      
      - ..项目名
        - maps, materials, models, particles不用管,是之前content下编译后的文件
        
        - \scripts  技能
          - \npc	存放技能,英雄,单位的KV文件
            - \herolist.txt	设置选人启用的英雄
            
              ```txt
              "CustomHeroList"
              {
                  "npc_dota_hero_phantom_assassin" "-1"
                  "npc_dota_hero_meepo" "-1"
                  "npc_dota_hero_pudge" "-1"
                  "npc_dota_hero_lina" "-1"
              }
              ```
            
              默认为0不显示,1为可选, -1?
            
          - \vscripts  存放lua语言编写的文件
          
          - \shops  文件夹设置商店物品(可通过npc下修改)
          
        - \resource 
          - \addon_schinese.txt  本地化中文文件
          - \flash3  图标等内容
            - \images
              - \spellicons 技能图标

## 快捷键

-  Hammer快捷键F9 run map打开地图
-  游戏中 F6 打开前端控制台
-  游戏中 反斜杠`\`  打开VConsole

## 测试/作弊指令

- [常用测试指令 - DotA中文维基 - 灰机wiki (huijiwiki.com)](https://dota.huijiwiki.com/p/140255)

- [【翻译+教程】DotA2 测试/作弊指令大全【dota2吧】_百度贴吧 (baidu.com)](https://tieba.baidu.com/p/2199201677?red_tag=2585701344&see_lz=1)

- ==如何测试==?

  - 本体启动选项 `-console` 进入客户端后可以按反斜杠 `\` 打开控制行 (可同时配合本地虚拟机双开)
    ![image-20231116142335544](https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/11/16/14-23-35-256ee1df7868db4bd454fda2a1c7d2ba-image-20231116142335544-6085d0.png)

    效果如下图
    ![image-20231116142955060](https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/11/16/14-29-55-07f80930ac8dda0d0641a225df41e70b-image-20231116142955060-516247.png)


## 开发工具

- VS插件dota-reborn-code
- [矩阵编辑器入门指南|dota2 rpg AMHC -](http://www.dota2rpg.com/forum.php?mod=viewthread&tid=3727&extra=page%3D1)
- 





# bugs

- ~~玲珑心~~ 描述有问题但,生效
  <img src="https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/06/26/17-10-45-1cf7fbb14ae5ff1b6ab7f09c73fe3f20-image-20230626171044998-edfb4a.png" alt="image-20230626171044998" style="zoom: 50%;" />

- ~~斧王转~~

- ~~宙斯蓝量~~

- ~~米波层数~~

  - CLocalize::FindSafe failed to localize: #DOTA_Tooltip_modifier_meepo_ransack_onatk

  开局先获得 洗劫层数buff onatk

  攻击时层数buff加给了 ransack

- ~~蛇谷绑人生效~~

- 所有数据驱动调用的GetSpecialValueFor得不到数值, 可以通过local数组配合获取技能等级GetLevel()

  - 大概修好了

- ~~米波洗劫技能描述~~

- ~~斧王螺旋技能描述~~

- 经验共享问题和数值问题

- ~~装备额外回血~~

- ~~装备额外蓝量~~

- ~~装备额外回蓝~~

- 某种未知原因导致无法弹窗等操作,买不了地攻不了城

- 蓝量

- 斧王使用跳刀 购买 精气之球后走到自身领地 回合计时器暂停





## 修改

- F:\SteamLibrary\steamapps\common\dota 2 beta\game\dota_addons\dafuweng\scripts\vscripts\modifiers\modifier_fix_damage.lua
  - local magicalArmor = self:Script_GetMagicalArmorValue()
  
-   测试开局野怪

  ​	nNum1 = 2
  ​	nNum2 = 4
  
- if nGold > 0 then

  ​    nGold = nGold - 1000

    end
  
-   if table.maxn(GMManager.m_tabOprtCan) > 1 then

  ​    GMManager:updataTimeOprt()

    end
  
- 神秘法杖改回来

- 

## 亡国清算逻辑

所有修改的金币时检查是否没钱了:

```lua
	if (lastnGold >= 0) ~= (nGold >= 0) then
		print("self.m_nPlayerID:",self.m_nPlayerID)
		EventManager:fireEvent(DeathClearing.EvtID.Event_TO_SendDeathClearing, { nPlayerID = self.m_nPlayerID })
	end
```

是的话触发事件Event_TO_SendDeathClearing, 该事件在初始化时注册



![image-20230705213809885](https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/07/05/21-38-10-a90a318a18a4c1d6c5dca9fd62c8adee-image-20230705213809885-eff308.png)

![image-20230705213828000](https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/07/05/21-38-28-981fca2a549ac484af04e8f44fa51b74-image-20230705213828000-05b5dd.png)






# 思路

- addon_game_mode : Precache预加载和初始化
  - 初始化时调用gmmanager并初始化GMManager:init, 设置所有游戏规则
    - ==self:registerEvent()	注册事件==
    - ==self:registerMessage()  注册消息==
    - ==self:registerThink()  注册计时器==
    -   Service:init(bReload)  氪金
    -   Filters:init(bReload)  过滤器
    -   Attributes:init(bReload)  属性值
    -   ParaAdjuster:Init()  平衡属性值
    -   PlayerManager:init(bReload)  玩家管理模块
      - Player	玩家类
    -   PathManager:init(bReload)  路径管理模块
      Entities:FindAllByClassname('path_corner')
    -   AbilityManager:init(bReload)  lua技能模块
    -   CardManager:init(bReload)  卡牌管理模块
    -   Trade.init(bReload)  交易模块
    -   Auction.init(bReload)  拍卖
    -   DeathClearing.init(bReload)  死亡清算
    -   SkinManager:init(bReload)  皮肤管理模块
    -   ItemManager:init(bReload)  装备管理
    -   Selection:init(bReload)  选择器(升级兵卒等)
    -   Supply:init(bReload)  补给环节(自选装备)
      EventManager:register("Event_UpdateRound", Supply.onEvent_UpdateRound, Supply)
      EventManager:register("Event_PlayerDie", Supply.onEvent_PlayerDie, Supply, 10000)
    -   HeroSelection:init(bReload)  选择英雄及玩家轮序
    -   GSManager:init(bReload)  游戏状态管理



## TS项目思路整理

- index.ts启动项目
  - new GameConfig();	
    - export class GameConfig	配置游戏规则及注册事件/消息/计时器
  - 所有模块初始化: (?思考应该在这里与GameConfig同级之后还是放在gameconfig构造里面)
  - new PlayerManager().init()
  - ...
  



## Todo

1. 什么是pathlog?

   self.m_eLog = Entities:FindByName(nil, "PathLog_" .. self.m_nID)

   if self.m_eLog then

   ​    ----创建log单位

   ​    self.m_eUnit = CreateUnitByName("PathLog_" .. self.m_nID, self.m_eLog:GetAbsOrigin(), false, nil, nil, DOTA_TEAM_NEUTRALS)

   ​    self.m_eUnit.m_path = self

   ​    ---- entity:SetModel(self.m_eLog:GetModelName())

   ​    ---- entity:SetOriginalModel(self.m_eLog:GetModelName())

   ​    ---- entity:SetForwardVector(self.m_eLog:GetForwardVector())

   ​    ---- self.m_eLog:SetOrigin(self.m_eLog:GetOrigin() - Vector(0, 0, 1000))

     end

2. CGameParticleManager::SetParticleControlEnt: Unable to lookup attachment attach_attack1 on model  for entity npc_dota_creature

3. ==兵卒相关==

   1. ==调整==:
      1. m_bBattle: boolean = null  由bz定义 
         - 有bug, 在player.setAllBZAttack无法正确获取到
      2. m_bGCLD: boolean = null  由player定义, 注意检测兵卒是否可用问题
      3. 去掉m_bBZ判断兵卒，通过IsRealHero判断是否是兵卒
   2. 天辉path_12 三个合体?
   3. 检查兵卒创建的属性合理性，初始生命值，攻击力
   4. 检查全才英雄兵卒的创建, 攻击力加成
   5. ==存在创建多个兵卒后，新创建的兵卒血量较少不正常，检查该情况==
      检查兵卒血量和力量属性buff

4. ==路径相关==

   1. path_13_hundun 三级双河道buff? 造成伤害时，物理视为魔法，魔法视为物理?
   2. 测试path_13护甲穿透和魔法穿透是否生效

5. ==回合相关==

   1. 如果回合开始前有操作, 需要设置GameLoop.==m_bRoundBefore==为true, 并在回合前操作完成后去手动跳转至begin GameLoop.GameStateService.send("tobegin")
      1. GSFinished_Entry会调用addRound, addRound会触发事件==Event_UpdateRound==, 所有在回合前有操作的都会注册该事件并至少做两件事:
         1. 设置m_bRoundBefore为true

         2. 进行回合前操作,手动跳转至对应的GameLoopState

         3. 操作完成后手动跳转回对应的begin

6. ==蓝量相关==, 重做修改属性的方法, 主要是蓝量

   1. ParaAdjuster.ModifyMana(英雄单位, 额外蓝量, 修正系数)
      	额外蓝量: 每回合给Player增加的m_nManaMaxBase
   2. 选择英雄/升级/监听装备事件
   3. ==问题== :
   4. 还需要继续测试
   5. 测试技能蓝量和CD能否正确缩减

7. UnRegister Failed Event Move?

   1. 以及所有注销事件的调用尽量用ByID

8. judgeBuffRound和 player的setRoundFinished触发的Event_PlayerRoundFinished存在问题？

9. ==装备/卡牌相关==

    1. 测试CD物品在监狱的情况，比如猎野爪

    2. ==TODO==
        1. 完成CardFactory

        2. 测试Player.setCardAdd里的sendMsg部分的JSON.stringify能不能正确json化字符

        3. 继续item_qtg_iron_talon.OnSpellStart里的onItem_getCard(this, player, "MONSTER")整个逻辑
        
        4. 

10. 实现CamerManage的前端部分
        检查pa一技能使用后镜头是否正确移动

11. 音效:

     1. 玩家回合倒计时结束自动骰子时声音异常Roll声音会重复发出

12. huderror前端部分实现

13. GameLoop需重新调整的点

         1. 切换状态是否需要封装？
         2. 新增GSRoundBefore
         3. 重新理清状态图
         0.7(0.3*(1-y))*x=0.98
         

14. ~~Player.setState重写~~，替换为setPlayerState

        -  遗留问题: BKB魔法免疫问题
          - 屠夫钩子对bkb

15. 在一个合适的时机通过后端事件通知前端关闭操作提示框

16. 检查setPlayerMuteTrade能否生效

17. ==前端相关==

         1. 关闭以下前端页面:
                1. Pannel id="AbilityGameplayChanges"  #AbilityGameplayChanges
                2. Label class="AbilityBuildHeader"  .AbilityBuildHeader
         
                3. Label id="AbilityBuildComment"  #AbilityBuildComment
         
         2. 新回合开始要关闭前端操作面板?或者重新考虑逻辑
         
         3. 禁用天赋树点击事件 参考http://www.dota2rpg.com/forum.php?mod=viewthread&tid=4491&highlight=%3F%3F%3F
         
         4. 移除天赋树属性面板

18. 本地化翻译所有this.m_strCastError

19. ~~setKillCountAdd源码逻辑是否合理~~

20. 重写了技能tsbaseability的GetCastRange

        1. 需要分清不同技能的情况
        2. 默认重写的tsbaseability中的getcastrange是以路径ID为距离计算返回的整数
        3. 如果分情况需要再对应的技能里重写getcastrange
        4. ==TODO==：调整PA技能范围为格数，而非距离

21. 游戏记录模块 game_record客户端操作, 更新记录面板

22. 分开事件, 分开发送？可能没有必要，待确认

23. ~~PlaySort与机器人的情况有点问题,总是021~~
        注意使用RandInt方法来生成随机数

24. 添加 unit 

            1. "path_17_diao"
                	{
                      		"BaseClass"		"npc_dota_creature"
                      		"Model"			"models/creeps/neutral_creeps/n_creep_vulture_a/n_creep_vulture_a.vmdl"
                      		"ModelScale"	"1"
                      		"Ability1"	"jiaoxie"
                      		"Ability2"	"no_bar"
                      		// "Ability3"	"no_collision"
                      		"Ability4"	"magic_immune"
                      		"Ability5"	"physical_immune"
                      		"Ability6"	"no_all_select"
                      		"MovementCapabilities"	"DOTA_UNIT_CAP_MOVE_NONE"
                      		"StatusHealth"	"1"
                      	}
        
        1. setDiaoGesture 雕哥施法检查
        2. 雕哥施法鬼畜，第一个飓风不会消除

25. PathRune

26. 在自定义事件里传数据不能引用类型,注意部分事件触发函数内的方法需改写

27. Roll点的随机路径平衡机制数值思考

28. 检查网表GamingTable的nSumGold总资产计算是否正确

29. addon_schinese.txt :		"RandomTip"						"随机英雄"

30. 统一所有英雄移速 ? 重新设计移速，290力量300全才/智力310敏捷，再根据强弱适当调整

31. 检查FireEvent的args参数为空的情况

32. /**设置结算数据 */
            setGameEndData(){}

33. ~~==sendMsg和broadcastMsg的tabData格式==~~

34. ~~gamestate的计时器update是0.1调用一次~~

35. ~~// 监听玩家移动回路径~~

36. ~~onMove如何处理gamestateloop~~

37. 英雄经验系统/数值

38. 客户端,前端 请求传输数据缩减

39. 考虑把莉娜的兵卒技能换成光击阵

40. 验证AMHC.Damage
            ```
                        if (tData) {
                            for (const v of tData) {
                                event.push(v)
                            }
                        }
            ```

41. HudError:FireLocalizeError

42. ~~Script Runtime Error: ...ripts\vscripts\ability\axe\Ability_axe_battle_hunger.ts:92: attempt to index field 'EventManager' (a nil value)~~
            ~~stack traceback:~~
            ~~[C]: in function '__index'~~

        通过  if (IsClient())  return 解决
         但是为什么? 原因? 如何理解

43. custom_sounds 有问题

            Failed loading resource "soundevents/custom_sounds.vsndevts_c" (ERROR_BADREQUEST: Code error - bad request)
            参考

44. 天赋树

        1. 龙骑 2024年1月是哪年的冬季呢
        2. 炸弹人 问涛宝

45. 出狱思路:

        1. 进入新的回合开始, onEvent_PlayerRoundBegin
            1. 如果在监狱
                1. 后端给前端发送 TypeOprt.TO_PRISON_OUT(5) 操作
        
                2. 前端弹出监狱Panel
        
                3. 用户点击是或者否对应回包的nRequest 1和0
                    GameEvents.SendCustomGameEventToServer
        
                4. 后端GameConfig.onMsg_oprt ==> processPrisonOut
        
            2. 如果不在监狱==>正常roll点
                1. roll点豹子到达三次
                    - onEvent_Roll ==> setInPrison
        
                2. roll点走到监狱路径
                    - onPath ==> setInPrison

46. 注意前端面板应该仅展示给对应的玩家

47. 做一个动画效果,肉山大转盘, 可以不花钱投,但是轮盘概率会很小中将,
       如果给100,中将的就会轮盘区域就会动画过渡变大
       给更多变更大


## 注意/调整

-  if (this.nInit == this.getPlayerCount()) {

​          this.nInit == null

​          ==this.m_bAllPlayerInit = true==

​        }

- state: 

  - setPlayerState 设置玩家状态, 指示位标识计算

  - setGameState 设置回合状态

    ```typescript
    GameRules.GameLoop.Timer(() => {
    	GameRules.GameLoop.GameStateService.send("towaitoprt")
    	return null
    }, 0)
    ```

- copyBfToEnt

  - oBuff.m_nRound

- 所有兵卒的m_bBZ可以用IsRealHero() 来判断

- Modifier应该尽量通过这种方式添加 类.name, 同时指定引入相应的类
  target.AddNewModifier(this.GetCaster(), this, ==modifier_ancient_seal.name==, { duration: seal_duration });
  
  



## 编写一个新英雄的过程

1. npc_heroes_custom.txt 定义英雄
2. npc_abilities_custom.txt 定义技能(x模板里用kv.excel的abilities)
3. 实现lua技能的对应的script代码
4. npc_units_custom.txt 定义英雄对应的兵卒(x模板里用kv.excel的minions)

     - !! 并在constant.ts中给HERO_TO_BANNER和HERO_TO_BZ数组添加对应内容

     - !! 还要更改旗帜模型的skin设置, 添加新英雄头像, 重新编译地图

     - 注意: 可能还要给兵卒单独定义和编写技能

5. 本地化 resource\addon_english.txt resource\addon_schinese.txt
   X模板编写 resource\addon.csv






## 状态机GameLoop

状态机负责游戏循环/进程, 状态机的每个状态为一个循环,一个循环里可以嵌套状态机/循环



/mode/GameLoop

![image-20230715174833787](https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/07/15/17-48-33-1cae1a237ad3263414f79f617da3f8a7-image-20230715174833787-1035f1.png)

?:

进入状态方法, 离开状态方法, 状态中的方法呢?



setGameState!



GSWaitOprt_Entry()执行Roll点,调用GameConfig.processRoll()方法{

​	得到roll点后,setState进入GS_Wait 处理超时
​	设置计时器等待客户端roll点动画结束后触发roll点事件Event_Roll

}

触发Event_Roll回调函数{

​	setState进入GS_Move

}



### 记录所有状态切换情况

有前摇的技能，米波施放忽悠时进入GS_Wait, 释放结束后回到GS_WaitOprt



## 英雄设计

- 幽鬼(冠名:qwerty-)
- 幻影刺客 npc_dota_hero_phantom_assassin
  - 1技能 闪烁突袭 Ability_phantom_strike
    选中一名英雄, 位移到他身边, 攻击1/2/3次
    ==判断是否施法目标是否合理, 非bz单位等??==
  - 2技能 原生数据驱动大招, 持续时间 160秒
  - 兵卒技能  原生数据驱动大招, 持续时间 160秒
- 米波 npc_dota_hero_meepo
  - 1技能 忽悠
  - 2技能 洗劫 平a增加层数可增加忽悠伤害
  - 兵卒技能 洗劫

- 屠夫 npc_dota_hero_pudge
  - 1技能 肉钩
  - 2技能 腐烂
  - 兵卒技能 腐烂

- 火女 npc_dota_hero_lina
  - 1技能 龙破斩
  - 2技能 光击阵
  - 兵卒技能 光击阵

- 宙斯 npc_dota_hero_zuus
  - 1技能 弧形闪电

  - 2技能 雷击

  - 兵卒技能 雷击

- 斧王 npc_dota_hero_axe
  - 1技能 战斗饥渴

  - 2技能 反击螺旋

  - 兵卒技能 反击螺旋
- TODO:
- 血魔
- 龙骑
- 小狗
- 尸王
- 炸弹人



Ti决赛壁画英雄

兽王 美杜莎 滚滚 白虎 土猫



## 装备

中立物品槽位: 15

TP卷轴槽位: 16

设置TP卷轴槽位覆盖的装备 SetTPScrollSlotItemOverride(itemName: string): nil #CDOTABaseGameMode

==注意装备共享share时不应该共享tp卷轴==

### 堆叠

物品如果要堆叠并在UI界面显示堆叠数要设置以下kv值

```txt
		"ItemPermanent" "0"			// 可以被消耗
		"ItemInitialCharges" "1"	// 获得时的充能数,也可以理解为堆叠数
		"ItemDisplayCharges" "1"	// 是否显示充能数,也可以理解为堆叠数
        "ItemStackable" "1"			// 是否开启堆叠
```

GetNetWorth 获取玩家财产总和

### 商店

game\scripts\shops\1x6_shops.txt

#### 刀富翁原则

价格

- 价格越便宜，性价比可以相对越高，（单件和没有卷轴的）性价比系数：
  - 小于1000，计算价格 * 0.6 = 最终价
  - 1000~2000，计算价格 * 0.8 = 最终价
  - 2000~3000，计算价格 * 0.9 = 最终价
  - 大于3000，计算价格 * 1 = 最终价
- 1点属性=100块
- 1攻击=66.7块，1.5攻击=100块
- 1点攻速=50块
- 100点生命值=400块，25点生命值=100块
- 1点护甲=150块，0.667护甲=100块
- 10%魔法抗性=500块，2%魔抗=100块
- 回血？
- 1点回蓝=1000块，0.125点回蓝=100块
- 100点血=500块，20点血=100块
- 1点蓝=500块
- 1%吸血=80块





- 跳刀: 占装备位
  - 可升级大跳刀
- TP: 占卷轴位

防御: 赤红甲 强袭

绿鞋, 非本人回合可以回复5%已损失生命值

```txt
"dota_shops"
{
	"consumables"   // 消耗品
	{
		// TP卷轴，200
        "item"		"item_qtg_tpscroll"
		// 仙灵火，100，加5攻击，消耗回100血
		"item"		"item_faerie_fire"				
		// 芒果，100，消耗回2点蓝
		"item"		"item_famango"
		// "item"		"item_bottle"
		// "item"		"item_aghanims_shard"
	}

	"attributes"    // 属性
	{
		// 力量腰带
		"item"		"item_belt_of_strength"
		// 精灵布带
		"item"		"item_boots_of_elves"
		// 法师长袍
		"item"		"item_robe"
		// 王冠
		"item"		"item_crown"

		// 食人魔之斧
		"item"		"item_ogre_axe"
		// 欢欣之刃
		"item"		"item_blade_of_alacrity"
		// 魔力法杖
		"item"		"item_staff_of_wizardry"
		// 宝冕
		"item"		"item_diadem"
		
	}

	"weapons_armor" // 装备
	{
		// 猎野爪（原寒铁钢爪）
		"item"		"item_iron_talon"   
		// 淬毒之珠
		"item"		"item_orb_of_venom"
		// 枯萎之石
		"item"		"item_blight_stone"
		// 攻击之爪
		"item"		"item_blades_of_attack"
		// 加速手套
		"item"		"item_gloves"
		// 锁子甲
		"item"		"item_chainmail"
		// 	短棍
		"item"		"item_quarterstaff"
		// 铁意头盔
		"item"		"item_helm_of_iron_will"
		// 大剑
		"item"		"item_claymore"				
	}
			
	"misc"  // 其他
	{
		// 毛毛帽
		"item"		"item_fluffy_hat"
		// 抗魔斗篷
		"item"		"item_cloak"
		// 速度之靴
		"item"		"item_boots"

		// 吸血面具
		"item"		"item_lifesteal"
		// 巫毒面具
		"item"		"item_voodoo_mask"

		// 幽魂权杖
		"item"		"item_ghost"
		// 闪烁匕首
		"item"		"item_blink"		
	}	
	
	// Level 1 - Green Recipes
	"basics"    // 配件
	{		
		// 腐蚀之球
		"item"		"item_orb_of_corrosion"
		// 猎鹰战刃
		"item"		"item_falcon_blade"
		// 动力鞋
		"item"		"item_power_treads"
		// 相位鞋
		"item"		"item_phase_boots"
		// 空明杖
		"item"		"item_oblivion_staff"
 		// 疯狂面具
		"item"		"item_mask_of_madness"
		// 银月之晶
		"item"		"item_moon_shard"	
	}

	// Level 2 - Blue Recipes
	"support"   // 辅助
	{
		// 玄冥盾牌
		"item"		"item_buckler"
		// 王者之戒
		"item"		"item_ring_of_basilius"
		// 恢复头巾
		"item"		"item_headdress"
		// 静谧之鞋
		"item"		"item_tranquil_boots"
		// 勇气勋章
		"item"		"item_medallion_of_courage"
		// 奥术鞋
		"item"		"item_arcane_boots"
		// 洞察烟斗
		"item"		"item_pipe"			
	}
				
	"magics"    // 法器		
	{
		// 原力法杖
		// "item"		"item_force_staff"
		// 巫师之刃
		"item"		"item_witch_blade"

		// 达贡之神力系列 item_dagon_[#] (1-5)
		"item"		"item_dagon"
		// 紫怨
		"item"		"item_orchid"	
		// 炎阳纹章
		"item"		"item_solar_crest"
		// 阿托斯之棍
		"item"		"item_rod_of_atos"
		// 刷新球
		"item"		"item_refresher"
		// 玲珑心
		"item"		"item_octarine_core"
		// 邪恶镰刀
		"item"		"item_sheepstick"
		// 缚灵索
		// "item"		"item_gungir"
	}
		
	// Level 3 - Purple Recipes	
	"defense"   // 防具
	{
		// 先锋盾
		"item"		"item_vanguard"
		// 刃甲
		"item"		"item_blade_mail"
		// 振魂石，可以设计为降受到的魔法伤害转变为生命值？
		"item"		"item_soul_booster" // 振魂石,再次鼓起丧失的勇气
		// 赤红甲
		"item"		"item_crimson_guard"		
		// 黑皇杖
		"item"		"item_black_king_bar"
		// 飓风长戟
		// "item"		"item_hurricane_pike"	
		// "item"		"item_sphere"
		// 希瓦的守护
		"item"		"item_shivas_guard"
		// 恐鳌之心
		"item"		"item_heart"	
		// 强袭胸甲
		"item"		"item_assault"
	}
			
	"weapons"   // 兵刃
	{	
		// 水晶剑
		"item"		"item_lesser_crit"	
 		// 黯灭
		"item"		"item_desolator"	
		// 虚灵之刃
		"item"		"item_ethereal_blade"
		// "item"		"item_nullifier"	
		// 蝴蝶
		"item"		"item_butterfly"
		// 	辉耀
		"item"		"item_radiance"
		// 代达罗斯之殇
		"item"		"item_greater_crit"
		// 圣剑
		"item"		"item_rapier"
		// 血棘
		"item"		"item_bloodthorn"
		// 英灵胸针
		"item"		"item_revenants_brooch"	
	}
		
	// Level 4 - Orange / Orb / Artifacts				
	"artifacts" // 宝物
	{	
		// 魔龙枪
 		// "item"		"item_dragon_lance"
		// 散华
		"item"		"item_sange"
 		// 夜叉
		"item"		"item_yasha"
 		// 慧光
		"item"		"item_kaya"
 		// 法师克星
		"item"		"item_mage_slayer"
 		// 散慧对剑
		"item"		"item_kaya_and_sange"
 		// 散夜对剑
		"item"		"item_sange_and_yasha"
 		// 慧夜对剑
		"item"		"item_yasha_and_kaya"
 		// 撒旦之邪力
		"item"		"item_satanic"		
 		// 斯嘉蒂之眼
		"item"		"item_skadi" 
 		// 盛势闪光
		"item"		"item_overwhelming_blink"		
 		// 迅疾闪光
		"item"		"item_swift_blink"		
 		// 迅疾闪光
		"item"		"item_arcane_blink"		
	}

	"sideshop1"
	{
		"item"		"item_tpscroll"
		"item"		"item_magic_stick"
		"item"		"item_quelling_blade"
		"item"		"item_boots"
		"item"		"item_boots_of_elves"
		"item"		"item_belt_of_strength"
		"item"		"item_robe"
		"item"		"item_crown"
	}

	"sideshop2"
	{
		"item"		"item_gloves"
		"item"		"item_chainmail"
		"item"		"item_cloak"
		"item"		"item_void_stone"
		"item"		"item_helm_of_iron_will"
		"item"		"item_energy_booster"
		"item"		"item_vitality_booster"
		"item"		"item_lifesteal"
		"item"		"item_broadsword"
		"item"		"item_blink"
	}
	
	"secretshop"
	{				
		"item"		"item_ring_of_health"
		"item"		"item_void_stone"
		"item"		"item_energy_booster"
		"item"		"item_vitality_booster"
		// "item"		"item_talisman_of_evasion"
		"item"		"item_platemail"
		"item"		"item_hyperstone"
		"item"		"item_ultimate_orb"
		"item"		"item_demon_edge"
		"item"		"item_mystic_staff"
		"item"		"item_reaver"
		"item"		"item_eagle"
		"item"		"item_relic"
	}

}
```





## 卡牌

卡牌前后端交互的思路：

1. 装备的Buff，Oncreated，获得该装备时进行判断：
2. 从商店购买获得，立刻获得一张卡牌，并开启倒计时判断
3. 从背包拖到装备栏获得，判断是否有重复物品在CD，设置为原先的CD
4. Player.setCardAdd 从服务端发送数据到客户端

   ```typescript
           // 通知客户端获得卡牌
           this.sendMsg('S2C_GM_CardAdd', {
               nPlayerID: this.m_nPlayerID,
               json: json.encode(card.encodeJsonData()),
           });
   ```
5. 客户端react函数监听GameEvent，存储数据并修改卡牌

   ```tsx
       /**新增手牌 */
       useGameEvent('S2C_GM_CardAdd', event => {
           if (event.nPlayerID == Players.GetLocalPlayer()) {
               for (const key in event.json) {
                   const handCard = new HandCard(event.json[key]);
                   updateCardList(event.nPlayerID, handCard.nCardID, handCard);
               }
           }
       });
   ```
6. CardPanel为父组件，遍历cardlist生成子组件卡牌容器

   - 【完成新增手牌】
7. 子组件卡牌容器<Card\>渲染时绑定拖拽事件
8. 拖拽出手牌区域表示为打出，card.tsx SendTagert发送相关施法数据至服务端

   - 【完成前端打出卡牌并发送数据至后端】

9. CardManager注册监听回调onEvent_CardUseRequest函数处理卡牌施法请求
10. 处理成功则PlayerManager.broadcastMsg广播全部玩家

    - 处理失败则player.sendMsg单独通知请求玩家

11. 前端监听





### cardlist

- 阎刃	"Card_MAGIC_InfernalBlade"
- 刀刀兄弟，全员补给
- 赏金符全体+钱
- 商店卡
- 海妖娜迦，大招，移动范围睡眠，持续两回合



# 开发草稿

- player 

  - 成员变量定义

  - 构造函数

  - 初始化

  - player.  initTeam() {

    - 类型定义  m_tabHasCard = null     //  手上的卡牌

        m_tabUseCard = null     //  已使用的卡牌

        m_tabDelCard = null     //  已移除的卡牌

        m_tCourier = null       //  信使

- path路径

- ==todo==// 重新发送手牌

  ​      oPlayer.sendHandCardData()

- EventManager:fireEvent 替换为

- // 设置网表

  ​    const keyname = "player_info_" + this.m_nPlayerID as

  ​      "player_info_0" | "player_info_1" | "player_info_2" | "player_info_3" | "player_info_4" | "player_info_5";

  ​    const info = CustomNetTables.GetTableValue("GamingTable", keyname)

  

## Path

Path的类class name应以	path_corner 
通过 `let tabAllPathEntities = Entities.FindAllByClassname("path_corner")` 获取entity

同时通过PathType获取其属性值
`const typePath = entity.GetIntAttr("PathType")`







## Roll

前端按钮触发GM_Operator,后端服务端监听到





## 群

<img src="https://raw.githubusercontent.com/york99alex/Pic4york/main/fix-dir/Typora/typora-user-images/2023/07/25/16-54-29-26ffdfa5d22796b5641ca47fe694acf2-image-20230725165429612-0d8335.png" alt="image-20230725165429612" style="zoom: 33%;" />

- 判断是否在水中
  local origin = thisEntity:GetAbsOrigin() local input = {startpos = origin+Vector(0,0,32),endpos = origin,mask = 32768} TraceLine(input) print(input.hit)



# 地图
