import { application } from "./application"
// import { eagerLoadControllersFrom from "@hotwired/stimulus-loading"
// eagerLoadControllersFrom("controllers", application)

// Manual import of controllers for Vite
import AppLauncherController from "./app_launcher_controller"
application.register("app-launcher", AppLauncherController)

import ChatController from "./chat_controller"
application.register("chat", ChatController)

import ClipboardController from "./clipboard_controller"
application.register("clipboard", ClipboardController)

import OnboardingController from "./onboarding_controller"
application.register("onboarding", OnboardingController)

import SidebarController from "./sidebar_controller"
application.register("sidebar", SidebarController)