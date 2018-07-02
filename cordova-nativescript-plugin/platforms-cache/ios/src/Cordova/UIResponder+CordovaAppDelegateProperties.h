//
//  UIResponder+CordovaAppDelegateProperties.h
//  testApp
//
//  Created by Martin Bekchiev on 8.05.18.
//  Copyright © 2018 Telerik. All rights reserved.
//

#ifndef UIResponder_CordovaAppDelegateProperties_h
#define UIResponder_CordovaAppDelegateProperties_h

#import <UIKit/UIResponder.h>

@interface UIResponder (CordovaAppDelegateProperties)

@property (nonatomic, strong) IBOutlet UIWindow* window;
@property (nonatomic, strong) IBOutlet UIViewController* viewController;

@end

#endif /* UIResponder_CordovaAppDelegateProperties_h */
