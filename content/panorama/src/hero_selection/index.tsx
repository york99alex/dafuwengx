import { render } from "react-panorama-x";

render(<></>, $.GetContextPanel())

const SelectHero = $.GetContextPanel().GetParent()!.GetParent()!.GetParent()!
function HideHudElement(name: string) {
    const element = SelectHero.FindChildTraverse(name)
    element != null ? element.visible = false : null
}
function HideHudClassElement(classname: string) {
    const element = SelectHero.FindChildrenWithClassTraverse(classname).forEach(x => x.visible = false)
}

HideHudElement("PreMinimapContainer")
HideHudElement("ViewModeControls")
HideHudElement("FriendsAndFoes")
HideHudClassElement("ScepterDetails")

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


