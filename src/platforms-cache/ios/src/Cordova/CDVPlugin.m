/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import "CDVPlugin.h"
#import "CDVCommandDelegateImpl.h"
//#import "CDVPlugin+Private.h"
//#import "CDVPlugin+Resources.h"
//#import "CDVViewController.h"
#include <objc/message.h>
#import "UIViewController+TopMostController.h"

//@implementation UIView (org_apache_cordova_UIView_Extension)
//
////@dynamic scrollView;
//
//- (UIScrollView*)scrollView
//{
////    SEL scrollViewSelector = NSSelectorFromString(@"scrollView");
////
////    if ([self respondsToSelector:scrollViewSelector]) {
////        return ((id (*)(id, SEL))objc_msgSend)(self, scrollViewSelector);
////    }
//
//    NSLog(@"Error: Unsupported method %@", NSStringFromSelector(_cmd));
//    return nil;
//}
//
//@end

NSString* const CDVPageDidLoadNotification = @"CDVPageDidLoadNotification";
NSString* const CDVPluginHandleOpenURLNotification = @"CDVPluginHandleOpenURLNotification";
NSString* const CDVPluginHandleOpenURLWithAppSourceAndAnnotationNotification = @"CDVPluginHandleOpenURLWithAppSourceAndAnnotationNotification";
NSString* const CDVPluginResetNotification = @"CDVPluginResetNotification";
NSString* const CDVLocalNotification = @"CDVLocalNotification";
NSString* const CDVRemoteNotification = @"CDVRemoteNotification";
NSString* const CDVRemoteNotificationError = @"CDVRemoteNotificationError";
NSString* const CDVViewWillAppearNotification = @"CDVViewWillAppearNotification";
NSString* const CDVViewDidAppearNotification = @"CDVViewDidAppearNotification";
NSString* const CDVViewWillDisappearNotification = @"CDVViewWillDisappearNotification";
NSString* const CDVViewDidDisappearNotification = @"CDVViewDidDisappearNotification";
NSString* const CDVViewWillLayoutSubviewsNotification = @"CDVViewWillLayoutSubviewsNotification";
NSString* const CDVViewDidLayoutSubviewsNotification = @"CDVViewDidLayoutSubviewsNotification";
NSString* const CDVViewWillTransitionToSizeNotification = @"CDVViewWillTransitionToSizeNotification";

@interface CDVPlugin ()

@property (readwrite, assign) BOOL hasPendingOperation;
@property (nonatomic, readwrite, weak) id <CDVWebViewEngineProtocol> webViewEngine;

@end

@implementation CDVPlugin
@synthesize webViewEngine, /*viewController,*/commandDelegate, hasPendingOperation;
@dynamic webView;

- (id)init
{
    self.commandDelegate = [[CDVCommandDelegateImpl alloc] init];
    return self;
}


- (UIViewController*)viewController {
    return [UIViewController topMostController];
}

- (void) setViewController:(UIViewController *)viewController {
    
}

// Do not override these methods. Use pluginInitialize instead.
- (instancetype)initWithWebViewEngine:(id <CDVWebViewEngineProtocol>)theWebViewEngine
{
    self = [super init];
    if (self) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onAppTerminate) name:UIApplicationWillTerminateNotification object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onMemoryWarning) name:UIApplicationDidReceiveMemoryWarningNotification object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleOpenURL:) name:CDVPluginHandleOpenURLNotification object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleOpenURLWithApplicationSourceAndAnnotation:) name:CDVPluginHandleOpenURLWithAppSourceAndAnnotationNotification object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onReset) name:CDVPluginResetNotification object:theWebViewEngine.engineWebView];
        
        self.webViewEngine = theWebViewEngine;
    }
    return self;
}

- (void)pluginInitialize
{
}

- (void)dispose
{
}

- (UIView*)webView
{
    NSLog(@"Error: Unsupported method %@", NSStringFromSelector(_cmd));
    return nil;
}

/*
// NOTE: for onPause and onResume, calls into JavaScript must not call or trigger any blocking UI, like alerts
- (void) onPause {}
- (void) onResume {}
- (void) onOrientationWillChange {}
- (void) onOrientationDidChange {}
*/

/* NOTE: calls into JavaScript must not call or trigger any blocking UI, like alerts */
- (void)handleOpenURL:(NSNotification*)notification
{
    NSLog(@"Error: Unsupported method %@", NSStringFromSelector(_cmd));
}

/*
    NOTE: calls into JavaScript must not call or trigger any blocking UI, like alerts
 */
- (void)handleOpenURLWithApplicationSourceAndAnnotation: (NSNotification*)notification
{
    NSLog(@"Error: Unsupported method %@", NSStringFromSelector(_cmd));
}


/* NOTE: calls into JavaScript must not call or trigger any blocking UI, like alerts */
- (void)onAppTerminate
{
    // override this if you need to do any cleanup on app exit
}

- (void)onMemoryWarning
{
    // override to remove caches, etc
}

- (void)onReset
{
    // Override to cancel any long-running requests when the WebView navigates or refreshes.
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];   // this will remove all notifications unless added using addObserverForName:object:queue:usingBlock:
}

- (id)appDelegate
{
    return [[UIApplication sharedApplication] delegate];
}

@end
