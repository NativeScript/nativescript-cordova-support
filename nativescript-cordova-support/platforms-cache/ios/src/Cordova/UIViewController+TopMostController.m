//
//  UIViewController+TopMostController.m
//
//  Created by Martin Bekchiev on 4.05.18.
//  Copyright © 2018 Telerik. All rights reserved.
//

#import "UIViewController+TopMostController.h"


@implementation UIViewController (TopMostController)

+ (UIViewController*) topMostController {
    UIViewController *topController = [UIApplication sharedApplication].keyWindow.rootViewController;
    
    while (topController.presentedViewController) {
        topController = topController.presentedViewController;
    }
    
    return topController;
}

@end

