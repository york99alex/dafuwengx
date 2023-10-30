import { Constant } from "../mode/constant";
import { IsValid } from "../utils/amhc";
import { reloadable } from "../utils/tstl-utils";
import { Path } from "./Path";
import { PathFactory } from "./pathfactory";

@reloadable
export class PathManager {

    /**全部路径 */
    m_tabPaths: Path[] = null
    m_tabMoveData: {
        nEntId: EntityIndex
        funCallBack: Function
    }[] = null

    init() {
        // 获取全部路径实体
        this.m_tabPaths = []
        this.m_tabMoveData = []
        let tabAllPathEntities = Entities.FindAllByClassname("path_corner")
        for (let index = 0; index < tabAllPathEntities.length; index++) {
            const value = tabAllPathEntities[index]
            if (string.sub(value.GetName(), 1, 4) == "path") {
                // 生成对象
                const oPath = PathFactory.create(value)
                this.m_tabPaths.push(oPath)
                // 路径视野
                AddFOWViewer(DotaTeam.GOODGUYS, value.GetAbsOrigin() + Vector(0, 0, 500) as Vector, 400, -1, true)
            }
            this.m_tabPaths.sort((a, b) => {
                return a.m_nID - b.m_nID
            })

            // 同步网标路径信息
            this.setNetTableInfo()
        }
        print("=====PathManager init完成==========")
    }

    /** 获取当前路径的下个路径 */
    getNextPath(pathCur: Path, nDis: number): Path {
        for (let index = 0; index < this.m_tabPaths.length; index++) {
            if (this.m_tabPaths[index] == pathCur) {
                let nIndex = index + nDis
                if (nIndex > this.m_tabPaths.length - 1)
                    nIndex = nIndex % this.m_tabPaths.length
                else if (nIndex <= 0)
                    nIndex += this.m_tabPaths.length
                return this.m_tabPaths[nIndex]
            }
        }
    }

    /**获取下个路径ID */
    static getNextPathID(nCurID: number, nDis: number): number {
        let nIndex = nCurID + nDis
        const nCount = 40
        if (nIndex > nCount) {
            nIndex %= nCount
        } else if (nIndex <= 0) {
            nIndex += nCount
        }
        return nIndex
    }

    getClosePath(vLoc: Vector): Path {
        let path: Path = null
        let nMin: number = null
        for (const value of this.m_tabPaths) {
            const nDis = (vLoc - value.m_entity.GetOrigin() as Vector).Length2D()
            if (nMin == null || nMin > nDis) {
                path = value
                nMin = nDis
            }
        }
        return path
    }

    /** 获取路径前方后方的尽头拐角点 */
    getVertexPath(pathCur: Path) {
        const [q, h] = PathManager.getVertexPathID(pathCur.m_nID)
        return [GameRules.PathManager.getPathByID(q), GameRules.PathManager.getPathByID(h)]
    }

    /**获取路径前方后方的尽头拐角点路径ID */
    static getVertexPathID(nCurID: number) {
        function isQ(nQ: number, nH: number) {
            for (let i = 0; i < Constant.PATH_VERTEX.length; i++) {
                if (nQ == Constant.PATH_VERTEX[i]) {
                    if (i > 0) {
                        return nH == Constant.PATH_VERTEX[i - 1]
                    } else {
                        return nH == Constant.PATH_VERTEX[Constant.PATH_VERTEX.length - 1]
                    }
                }
            }
            return false
        }

        let q: number, h: number
        for (let i = 0; i < Constant.PATH_VERTEX.length; i++) {
            if (nCurID > Constant.PATH_VERTEX[i]) {
                if (!h || isQ(Constant.PATH_VERTEX[i], h)) {
                    h = Constant.PATH_VERTEX[i]
                }
            } else if (nCurID < Constant.PATH_VERTEX[i]) {
                if (!q || isQ(q, Constant.PATH_VERTEX[i])) {
                    q = Constant.PATH_VERTEX[i]
                }
            }
        }
        if (!q) {
            q = Constant.PATH_VERTEX[0]
        }
        if (!h) {
            h = Constant.PATH_VERTEX[Constant.PATH_VERTEX.length - 1]
        }
        return [q, h]
    }

    /** 获取路径对象 */
    getPathByType(type: number) {
        let tabPath: Path[] = []
        for (let index = 0; index < this.m_tabPaths.length; index++) {
            if (type == this.m_tabPaths[index].m_typePath) {
                tabPath.push(this.m_tabPaths[index])
            }
        }
        return tabPath
    }

    /**获取路径对象 */
    getPathByID(nID: number) {
        for (let index = 0; index < this.m_tabPaths.length; index++) {
            if (nID == this.m_tabPaths[index].m_nID)
                return this.m_tabPaths[index]
        }
    }

    /**获取A路径到B路径的路径距离 */
    getPathDistance(oPathBegin: Path, oPathEnd: Path, bReverse?: boolean) {
        if (oPathBegin == oPathEnd) return 0

        let nDis = 0

        for (let i = 0; i < this.m_tabPaths.length; i++) {
            if (oPathBegin == this.m_tabPaths[i]) {
                for (let j = 0; j < this.m_tabPaths.length; j++) {
                    if (oPathEnd == this.m_tabPaths[j]) {
                        if (bReverse) {
                            nDis = i - j
                        } else {
                            nDis = j - i
                        }
                        if (nDis < 0) {
                            nDis += this.m_tabPaths.length
                        }
                        break
                    }
                }
                break
            }
        }
        return nDis
    }

    /**设置玩家网表信息 */
    setNetTableInfo() {
        let tabData: {
            vPos: {
                x: number;
                y: number;
                z: number;
            }
        }[] = []
        for (let i = 0; i < this.m_tabPaths.length; i++) {
            tabData.push({
                vPos: {
                    x: this.m_tabPaths[i].m_entity.GetAbsOrigin().x,
                    y: this.m_tabPaths[i].m_entity.GetAbsOrigin().y,
                    z: this.m_tabPaths[i].m_entity.GetAbsOrigin().z
                }
            })
        }

        // 设置网表
        CustomNetTables.SetTableValue("GamingTable", "path_info", tabData)
    }

    /**路径寻路移动 */
    moveToPath(entity: CDOTA_BaseNPC_Hero, path: Path, bEventEnable: boolean, funCallBack: Function) {
        const oPlayer = GameRules.PlayerManager.getPlayer(entity.GetPlayerID())
        const pathBegin = oPlayer.m_pathCur
        let pathCur = pathBegin
        // 当前路径是否为目的地
        let pathNext = pathCur == path ? pathCur : this.getNextPath(pathCur, 1)
        let vNext: Vector
        function getNextPos() {
            if (pathNext == path) {
                vNext = pathNext.getNilPos(entity)
            } else {
                vNext = pathNext.m_entity.GetOrigin()
            }
        }
        getNextPos()

        entity.MoveToPosition(vNext)

        const nEntId = entity.GetEntityIndex()
        // 结束上次移动
        if (this.m_tabMoveData[nEntId]) this.moveStop(entity, false)
        // 新的移动
        const tMoveData = {
            nEntId: nEntId,
            funCallBack: funCallBack
        }
        this.m_tabMoveData[nEntId] = tMoveData


        // 防卡死功能
        let nTimeKasi = 0
        let vLocLast = null
        function judgeKasi() {
            if (vLocLast == entity.GetAbsOrigin()) {
                nTimeKasi += 1
                if (nTimeKasi >= Constant.TIME_MOVEKASI) {
                    // 超过时间,直接设置到目的地
                    entity.SetAbsOrigin(path.m_entity.GetOrigin())
                    FindClearSpaceForUnit(entity, entity.GetAbsOrigin(), true)
                    GameRules.PathManager.moveStop(entity, true)
                    return false
                }
            } else {
                vLocLast = entity.GetAbsOrigin()
            }
            return false
        }
        // print("moveToPath===1")
        // 持续寻路
        Timers.CreateTimer(() => {
            // print("moveToPath===2")
            if (tMoveData != this.m_tabMoveData[nEntId]) return
            // print("moveToPath===3")
            if (!IsValid(entity) || !entity.IsAlive()) {
                this.moveStop(entity, false)
                return
            }
            // print("moveToPath===4")
            // 检验每个寻路点path_corner
            const nDis = (entity.GetOrigin() - vNext as Vector).Length2D()
            let nCheckDis = 30
            if (pathNext != path) {
                nCheckDis = entity.GetIdealSpeed() * 0.35 - 75
                if (nCheckDis < 30) nCheckDis = 30
            }
            // print("moveToPath===5")
            if (nDis < nCheckDis) {
                // print("moveToPath===6")
                // 触发事件: 途径某路径
                if (pathBegin != pathNext && bEventEnable) {
                    GameRules.EventManager.FireEvent("Event_PassingPath", { path: pathNext, entity: entity })
                }
                // print("moveToPath===7")
                if (pathNext == path || judgeKasi()) {
                    // print("moveToPath===8")
                    // 移动结束
                    this.moveStop(entity, true)
                    return null
                } else {
                    // 移动至下一个路径点
                    // print("moveToPath===9")
                    pathCur = pathNext
                    pathNext = this.getNextPath(pathCur, 1)
                    if (pathNext == null || pathNext == pathCur) {
                        // print("moveToPath===10")
                        this.moveStop(entity, true)
                        return
                    }
                    // print("moveToPath===11")
                    getNextPos()
                }
            }
            // print("moveToPath===12")
            entity.MoveToPosition(vNext)
            return 0.1
        })
        return true
    }

    /**坐标寻路移动 */
    moveToPos(entity: CDOTA_BaseNPC_Hero, location: Vector, funCallBack: Function) {
        if (!IsValid(entity)) {
            return
        }
        // 验证能否到达
        if (!entity.HasFlyMovementCapability() && !GridNav.CanFindPath(entity.GetAbsOrigin(), location)) {
            if (funCallBack) {
                funCallBack(false)
            }
            return
        }
        location = Vector(location.x, location.y, entity.GetAbsOrigin().z)

        // 防卡死功能
        let nTimeKasi = 0
        let vLocLast = null
        function judgeKasi() {
            if (vLocLast == entity.GetAbsOrigin()) {
                nTimeKasi += 1
                if (nTimeKasi >= Constant.TIME_MOVEKASI) {
                    // 超过时间,直接设置到目的地
                    entity.SetAbsOrigin(location)
                    FindClearSpaceForUnit(entity, entity.GetAbsOrigin(), true)
                    this.moveStop(entity, true)
                    return false
                }
            } else {
                vLocLast = entity.GetAbsOrigin()
            }
            return false
        }

        const nEntId = entity.GetEntityIndex()

        // 结束上一次移动
        if (this.m_tabMoveData[nEntId]) this.moveStop(entity, false)

        // 新的移动
        const tMoveData = {
            nEntId: nEntId,
            funCallBack: funCallBack
        }
        this.m_tabMoveData[nEntId] = tMoveData

        // 设置计时器监听移动结束，触发回调
        Timers.CreateTimer(() => {
            if (tMoveData != this.m_tabMoveData[nEntId]) return
            if (!IsValid(entity) || !entity.IsAlive()) {
                this.moveStop(entity, false)
                return
            }
            const nDis = (entity.GetAbsOrigin() - location as Vector).Length2D()

            let nCheckDis = 30
            nCheckDis = entity.GetIdealSpeed() * 0.35 - 75
            if (nCheckDis < 30) {
                nCheckDis = 30
            }
            if (nCheckDis < nDis || judgeKasi()) {
                // 移动结束
                this.moveStop(entity, true)
                return null
            }
            entity.MoveToPosition(location)
            return 0.1
        })
        return true
    }

    moveStop(entity: CDOTA_BaseNPC_Hero, bSuccess: boolean) {
        const tMoveData = this.m_tabMoveData[entity.GetEntityIndex()]
        if (tMoveData == null) return
        this.m_tabMoveData[entity.GetEntityIndex()] = null
        if (tMoveData.funCallBack != null)
            tMoveData.funCallBack(bSuccess)
    }
}