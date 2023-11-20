import { render } from "react-panorama-x";

render(<></>, $.GetContextPanel())

const SelectHero = $.GetContextPanel().GetParent()!.GetParent()!.GetParent()!
export function HideHudElement(context: Panel, name: string) {
    const element = context.FindChildTraverse(name)
    element != null ? element.visible = false : null
}
export function HideHudClassElement(context: Panel, classname: string) {
    context.FindChildrenWithClassTraverse(classname).forEach(x => x.visible = false)
}

HideHudElement(SelectHero, "PreMinimapContainer")
HideHudElement(SelectHero, "ViewModeControls")
HideHudElement(SelectHero, "FriendsAndFoes")
HideHudClassElement(SelectHero, "ScepterDetails")

let child = SelectHero.FindChildTraverse("GridCategories")
if (child) {
    child.style.flowChildren = "down"
    child.style.width = "55%"
    child.style.horizontalAlign = "right"
}

child = SelectHero.FindChildTraverse("BottomPanels")
if (child) child.style.horizontalAlign = "center"

child = SelectHero.FindChildTraverse("HeroAbilities")
if (child) {
    child.style.marginLeft = "40px"
    child.style.marginRight = "40px"
}


