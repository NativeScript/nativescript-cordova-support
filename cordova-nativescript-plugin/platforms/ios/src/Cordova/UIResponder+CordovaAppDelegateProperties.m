//
//  UIResponder+UIResponder_CordovaAppDelegateProperties.m
//  testApp
//
//  Created by Martin Bekchiev on 8.05.18.
//  Copyright © 2018 Telerik. All rights reserved.
//

#import "UIResponder+CordovaAppDelegateProperties.h"
#import "UIViewController+TopMostController.h"

@implementation UIResponder (CordovaAppDelegateProperties)

- (UIWindow*) window {
    return [UIApplication sharedApplication].keyWindow;
}

- (void) setWindow:(UIWindow *)window  {
}

- (UIViewController*) viewController {
    return [UIViewController topMostController];
}

- (void) setViewController:(UIViewController *)viewController  {
}

@end
